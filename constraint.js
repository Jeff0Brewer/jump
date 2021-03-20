class TriConstraint{
	constructor(p1, p2, p3, coeff, num){
		this.num = num;
		this.coeff = coeff;
		this.A = p1;
		this.B = p2;
		this.C = p3;
		this.E1 = vec3.subtract(vec3.create(), this.B, this.A);
		this.E2 = vec3.subtract(vec3.create(), this.C, this.A);
		this.N = vec3.cross(vec3.create(), this.E1, this.E2);
		this.n = vec3.normalize(vec3.create(), this.N);

		this.data_len = 0;
	}

	constrain(s1, s2){
		for(let n = 0; n < this.num; n++){
			let org = s1.slice(n*IND.FPP + IND.POS, n*IND.FPP + IND.POS + 3);
			let dir = vec3.subtract(vec3.create(), s2.slice(n*IND.FPP + IND.POS, n*IND.FPP + IND.POS + 3), org);
			let ts = vec3.length(dir);
			dir = vec3.normalize(dir, dir);

			let det = -1*vec3.dot(dir, this.N);
			let invdet = 1/det;
			let AO = vec3.subtract(vec3.create(), org, this.A);
			let DAO = vec3.cross(vec3.create(), AO, dir);
			let u = vec3.dot(this.E2, DAO) * invdet;
			let v = -1*vec3.dot(this.E1, DAO) * invdet;
			let t = vec3.dot(AO, this.N) * invdet;
			if(det > .0000001 && t >= 0 && t < ts && u >= 0 && v >= 0 && (u+v) <= 1){
				let p2 = vec3.scaleAndAdd(vec3.create(), org, dir, t);
				vec3.scaleAndAdd(p2, p2, this.n, .001);
				let v2 = s2.slice(n*IND.FPP + IND.VEL, n*IND.FPP + IND.VEL + 3);
				vec3.scaleAndAdd(v2, v2, this.n, -(1 + this.coeff)*vec3.dot(this.n, v2));

				s2[n*IND.FPP + IND.LIF] = 0;
				for(let i = 0; i < 3; i++){
					s2[n*IND.FPP + IND.POS + i] = p2[i];
					s2[n*IND.FPP + IND.VEL + i] = v2[i];
				}
			}
		}
	}
}

class FireConstraint{
	constructor(lifetime, max_mass, max_size, color_map, init, num){
		this.num = num;
		this.lif = lifetime;
		this.mass = max_mass;
		this.size = max_size;
		this.color_map = color_map;
		this.init = init;

		this.data_len = 0;
	}

	constrain(s1, s2){
		for(let n = 0; n < this.num; n++){
			let lif = s2[n*IND.FPP + IND.LIF];
			if(lif > this.lif){
				let p_new = this.init();
				for(let i = 0; i < p_new.length; i++){
					s2[n*IND.FPP + i] = p_new[i];
				}
			}
			else{
				let color = this.color_map(lif, [0, this.lif]);
				s2[n*IND.FPP + IND.MAS] = map(lif, [0, this.lif], [this.mass, 0]);
				s2[n*IND.FPP + IND.SIZ]= map(lif, [0, this.lif], [this.size, 0]);
				for(let i = 0; i < color.length; i++){
					s2[n*IND.FPP + IND.COL + i] = color[i];
				}
			}
		}
	}
}

class SphereConstraint{
	constructor(center, radius, coeff, ground, num){
		this.num = num;
		this.c = center;
		this.r = radius;
		this.coeff = -1*Math.abs(coeff);
		this.isgrnd = ground;


		let iso = gen_planet(gen_iso(4));
		let tri = new Float32Array(iso.length/3*10);
		let color = new Float32Array([1, 1, 1, 1]);
		let v_len = iso.length/3;
		for(let i = 0; i < v_len; i += 3){
			let a = iso.slice(i*3, i*3 + 3);
			let b = iso.slice((i+1)*3, (i+1)*3 + 3);
			let c = iso.slice((i+2)*3, (i+2)*3 + 3);
			let n = vec3.normalize([0,0,0], vec3.cross([0,0,0], vec3.subtract([0,0,0], b, a), vec3.subtract([0,0,0], c, a)));
			for(let j = 0; j < 3; j++){
				tri.set([
					this.r*iso[(i+j)*3],
					this.r*iso[(i+j)*3 + 1],
					this.r*iso[(i+j)*3 + 2],
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

		this.data = [tri, []];
		this.data_len = [tri.length, 0];
	}

	constrain(s1, s2){
		for(let n = 0; n < this.num; n++){
			let p2 = s2.slice(n*IND.FPP + IND.POS, n*IND.FPP + IND.POS + 3);
			let v2 = s2.slice(n*IND.FPP + IND.VEL, n*IND.FPP + IND.VEL + 3);
			if(dist(p2, this.c) < this.r && vec3.dot(vec3.subtract([0,0,0], p2, this.c), v2) < 0){
				if(this.isgrnd)
					s2[n*IND.FPP + IND.LIF] = 0;
				let v2 = s2.slice(n*IND.FPP + IND.VEL, n*IND.FPP + IND.VEL + 3);
				let dir = vec3.normalize([0,0,0], vec3.subtract([0,0,0], p2, this.c));
				let v_perp = vec3.scale([0,0,0], dir, vec3.dot(v2, dir));
				vec3.scaleAndAdd(v2, vec3.subtract([0,0,0], v2, v_perp), v_perp, this.coeff);
				vec3.scaleAndAdd(p2, this.c, dir, this.r);
				for(let i = 0; i < 3; i++){
					s2[n*IND.FPP + IND.POS + i] = p2[i];
					s2[n*IND.FPP + IND.VEL + i] = v2[i];
				}
			}
		}
	}

	get_buf_data(s){
		return this.data;
	}
}

class FixConstraint{
	constructor(particle_ind, position){
		this.ind = particle_ind;
		this.p = position;

		this.data_len = 0;
	}

	constrain(s1, s2){
		for(let i = 0; i < this.p.length; i++){
			s2[this.ind*IND.FPP + IND.POS + i] = this.p[i];
		}
		for(let i = 0; i < 3; i++){
			s2[this.ind*IND.FPP + IND.VEL + i] = 0;
		}
		for(let i = 0; i < 3; i++){
			s2[this.ind*IND.FPP + IND.FOR + i] = 0;
		}
	}
}

class BoundConstraint{
	constructor(axis_ind, min, max, num){
		this.ind = axis_ind;
		this.min = min;
		this.max = max;
		this.siz = max - min;
		this.num = num;

		this.data_len = 0;
	}

	constrain(s1, s2){
		for(let n = 0; n < this.num; n++){
			let p1 = s1[n*IND.FPP + IND.POS + this.ind];
			let p2 = s2[n*IND.FPP + IND.POS + this.ind];
			if(p1 >= this.min && p2 < this.min){
				s2[n*IND.FPP + IND.POS + this.ind] += this.siz;
			}
			else if(p1 <= this.max && p2 > this.max){
				s2[n*IND.FPP + IND.POS + this.ind] -= this.siz;
			}
		}
	}
}

class AxisConstraint{
	constructor(axis_ind, dir, offset, coeff, ground, num){
		this.ind = axis_ind;
		this.dir = dir > 0 ? 1 : -1;
		this.off = offset;
		this.coeff = -1*Math.abs(coeff);
		this.isgrnd = ground;
		this.num = num;

		this.data_len = 0;
	}

	constrain(s1, s2){
		for(let n = 0; n < this.num; n++){
			let p1 = s1[n*IND.FPP + IND.POS + this.ind];
			let p2 = s2[n*IND.FPP + IND.POS + this.ind];
			if((this.dir > 0 && p1 <= this.off && p2 > this.off) || 
			   (this.dir < 0 && p1 >= this.off && p2 < this.off)){
			   	if(this.isgrnd)
					s2[n*IND.FPP + IND.LIF] = 0;
				s2[n*IND.FPP + IND.POS + this.ind] = this.off;
				s2[n*IND.FPP + IND.VEL + this.ind] = this.coeff*s2[n*IND.FPP + IND.VEL + this.ind];
			}
		}
	}
}
