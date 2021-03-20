class Planet{
	constructor(pos, mass, radius){
		this.p = pos;
		this.r = radius
		this.m = mass;

		let tri = gen_planet(gen_iso(5));
		let color = new Float32Array([1, 1, 1, 1]);
		let v_len = tri.length/3;

		this.C_pos = [
			[this.r, 0, 0],
			[-this.r, 0, 0],
			[0, this.r, 0],
			[0, -this.r, 0],
			[0, 0, this.r],
			[0, 0, -this.r]
		];
		this.F = [new PlanetForcer(pos, mass, 1)];
		this.C = [[], [], [], [], [], []];
		this.data = new Float32Array(v_len*10);
		for(let i = 0; i < v_len; i += 3){
			let a = tri.slice(i*3, i*3 + 3);
			let b = tri.slice((i+1)*3, (i+1)*3 + 3);
			let c = tri.slice((i+2)*3, (i+2)*3 + 3);
			vec3.scale(a, a, this.r);
			vec3.scale(b, b, this.r);
			vec3.scale(c, c, this.r);
			let n = vec3.normalize([0,0,0], vec3.cross([0,0,0], vec3.subtract([0,0,0], b, a), vec3.subtract([0,0,0], c, a)));

			for(let j = 0; j < 3; j++){
				this.data.set([
					this.r*tri[(i+j)*3],
					this.r*tri[(i+j)*3 + 1],
					this.r*tri[(i+j)*3 + 2],
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
	}

	get_C(pos){
		let C = [];
		for(let i = 0; i < this.C_pos.length; i++){
			if(vec3.distance(this.C_pos[i], pos) < this.r){
				C = C.concat(this.C[i]);
			}
		}
		return C;
	}
}

function gen_planet(iso){
	let v_len = iso.length/3;
	let scl = [6, 4, 2, 1];
	let wgh = [.1, .2, .5, 1];
	for(let i = 0; i < v_len; i++){
		let r = 0;
		for(let j = 0; j < scl.length; j++){
			r += noise.perlin3(scl[j]*iso[i*3], scl[j]*iso[i*3 + 1], scl[j]*iso[i*3 + 2]);
		}
		r = (.5*(r/(scl.length*mag(wgh)) + 1))*.5 + .75;
		iso[i*3] *= r;
		iso[i*3 + 1] *= r;
		iso[i*3 + 2] *= r;
	}
	return iso;
}