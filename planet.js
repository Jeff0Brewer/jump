class Planet{
	constructor(pos, mass, radius){
		this.p = pos;
		this.r = radius
		this.m = mass;

		let terrain_tri = gen_iso(5);
		this.ocean_height = gen_terrain(terrain_tri)*this.r;
		let terrain_len = terrain_tri.length/3;
		let color = new Float32Array([1, 1, 1, 1]);

		this.terrain_data = new Float32Array(terrain_len*10);
		this.F = [new PlanetForcer(pos, mass, 1)];
		this.C_pos = [
			[this.r, 0, 0],
			[-this.r, 0, 0],
			[0, this.r, 0],
			[0, -this.r, 0],
			[0, 0, this.r],
			[0, 0, -this.r]
		];
		this.C = [];
		for(let i = 0; i < this.C_pos.length; i++){
			this.C.push([]);
		}
		
		for(let i = 0; i < terrain_len; i += 3){
			let a = terrain_tri.slice(i*3, i*3 + 3);
			let b = terrain_tri.slice((i+1)*3, (i+1)*3 + 3);
			let c = terrain_tri.slice((i+2)*3, (i+2)*3 + 3);
			vec3.scale(a, a, this.r);
			vec3.scale(b, b, this.r);
			vec3.scale(c, c, this.r);
			let n = vec3.normalize([0,0,0], vec3.cross([0,0,0], vec3.subtract([0,0,0], b, a), vec3.subtract([0,0,0], c, a)));

			for(let j = 0; j < 3; j++){
				this.terrain_data.set([
					this.r*terrain_tri[(i+j)*3],
					this.r*terrain_tri[(i+j)*3 + 1],
					this.r*terrain_tri[(i+j)*3 + 2],
					color[0],
					color[1],
					color[2],
					color[3],
					n[0],
					n[1],
					n[2]
				], (i + j)*10);
			}
			
			let C_ind = -1;
			let C_d = this.r*100;
			for(let j = 0; j < this.C_pos.length; j++){
				let d = vec3.distance(this.C_pos[j], a);
				if(d < C_d){
					C_d = d;
					C_ind = j;
				}
			}
			this.C[C_ind].push(new TriConstraint(a, b, c, .5, 1));
		}

		let ocean_tri = gen_iso(4);
		let ocean_len = ocean_tri.length/3;
		color = [.8, .9, 1, .5];
		this.ocean_data = new Float32Array(ocean_len*10);
		for(let i = 0; i < ocean_len; i += 3){
			let a = ocean_tri.slice(i*3, i*3 + 3);
			let b = ocean_tri.slice((i+1)*3, (i+1)*3 + 3);
			let c = ocean_tri.slice((i+2)*3, (i+2)*3 + 3);
			vec3.scale(a, a, this.r);
			vec3.scale(b, b, this.r);
			vec3.scale(c, c, this.r);
			let n = vec3.normalize([0,0,0], vec3.cross([0,0,0], vec3.subtract([0,0,0], b, a), vec3.subtract([0,0,0], c, a)));

			for(let j = 0; j < 3; j++){
				this.ocean_data.set([
					this.ocean_height*ocean_tri[(i+j)*3],
					this.ocean_height*ocean_tri[(i+j)*3 + 1],
					this.ocean_height*ocean_tri[(i+j)*3 + 2],
					color[0],
					color[1],
					color[2],
					color[3],
					n[0],
					n[1],
					n[2]
				], (i + j)*10);
			}
		}
	}

	update(pos){
		if(vec3.distance(pos, this.p) < this.ocean_height){
			if(gl.getParameter(gl.CULL_FACE))
				gl.disable(gl.CULL_FACE);
		}
		else{
			if(!gl.getParameter(gl.CULL_FACE))
				gl.enable(gl.CULL_FACE);
		}

		let C = [];
		for(let i = 0; i < this.C_pos.length; i++){
			if(vec3.distance(this.C_pos[i], pos) < this.r){
				C = C.concat(this.C[i]);
			}
		}
		return C;
	}

	get_C(pos){
		
	}
}

function gen_terrain(iso){
	noise.seed(Math.random());
	let v_len = iso.length/3;

	let h_range = .3;
	let h_min = .85;
	let h_exp = map(Math.random(), [0, 1], [.5, 3]);

	let n_scl = [3, 2, 1, .5];
	let n_wgh = [
		map(Math.random(), [0, 1], [.1, .3]),
		map(Math.random(), [0, 1], [.1, .3]),
		map(Math.random(), [0, 1], [.8, 1]),
		map(Math.random(), [0, 1], [.8, 1])
	];
	let n_mag = mag(n_wgh)

	let w_scl = map(Math.random(), [0, 1], [.05, .25]);
	let w_wgh = map(Math.random(), [0, 1], [.1, 3]);

	let h_avg = 0;
	for(let i = 0; i < v_len; i++){
		let h = 0;
		let warp = [
			w_wgh*noise.simplex3(w_scl*iso[i*3], w_scl*iso[i*3 + 1], w_scl*iso[i*3 + 2]),
			w_wgh*noise.simplex3(w_scl*iso[i*3 + 2], w_scl*iso[i*3], w_scl*iso[i*3 + 1]),
			w_wgh*noise.simplex3( w_scl*iso[i*3 + 1], w_scl*iso[i*3 + 2], w_scl*iso[i*3])
		];
		for(let j = 0; j < n_scl.length; j++){
			h += n_wgh[j]*noise.simplex3(n_scl[j]*iso[i*3] + warp[0], n_scl[j]*iso[i*3 + 1] + warp[1], n_scl[j]*iso[i*3 + 2] + warp[2]);
		}
		h = Math.max(Math.min(h/n_mag, 1.0), -1.0);
		h = Math.pow(.5*(h + 1), h_exp)*h_range + h_min;
		h_avg += h;
		iso[i*3] *= h;
		iso[i*3 + 1] *= h;
		iso[i*3 + 2] *= h;
	}
	return h_avg/v_len;
}