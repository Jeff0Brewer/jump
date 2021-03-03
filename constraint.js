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


		let iso = gen_iso(2, 'LIN');
		let lin = [];
		let color = [1, 1, 1, 1];
		for(let i = 0; i < iso.length; i++){
			lin = lin.concat(vec3.scaleAndAdd([0,0,0], this.c, iso[i], this.r));
			lin = lin.concat(color);
			lin.push(0);
		}

		this.data = [[], lin];
		this.data_len = [0, lin.length];
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

class WallConstraint{
	constructor(normal, orientation, center, width, height, coeff, ground, num){
		this.n = vec3.normalize([0,0,0], normal);
		this.dir = {
			x: vec3.normalize([0,0,0], orientation),
			y: vec3.normalize([0,0,0], vec3.cross([0,0,0], normal, orientation))
		}
		this.p = center;
		this.w = width;
		this.h = height;
		this.constants = normal.concat([-normal[0]*center[0] - normal[1]*center[1] - normal[2]*center[2]]);
		this.coeff = -1*Math.abs(coeff);
		this.isgrnd = ground;
		this.num = num;

		let points = [
			vec3.scaleAndAdd([0,0,0], vec3.scaleAndAdd([0,0,0], this.p, this.dir.x, this.w), this.dir.y, this.h),
			vec3.scaleAndAdd([0,0,0], vec3.scaleAndAdd([0,0,0], this.p, this.dir.x, this.w), this.dir.y, -this.h),
			vec3.scaleAndAdd([0,0,0], vec3.scaleAndAdd([0,0,0], this.p, this.dir.x, -this.w), this.dir.y, -this.h),
			vec3.scaleAndAdd([0,0,0], vec3.scaleAndAdd([0,0,0], this.p, this.dir.x, -this.w), this.dir.y, this.h)
		];
		let lin = [];
		let color = [1, 1, 1, 1];
		let ind = [0, 1, 1, 2, 2, 3, 3, 0];
		for(let i = 0; i < ind.length; i++){
			lin = lin.concat(points[ind[i]]);
			lin = lin.concat(color);
			lin.push(0);
		}

		this.data = [[], lin];
		this.data_len = [0, lin.length];
	}

	constrain(s1, s2){
		for(let n = 0; n < this.num; n++){
			let p1 = s1.slice(n*IND.FPP + IND.POS, n*IND.FPP + IND.POS + 3);
			let p2 = s2.slice(n*IND.FPP + IND.POS, n*IND.FPP + IND.POS + 3);
			if(dist_point_plane(p1, this.constants) >= 0 && dist_point_plane(p2, this.constants) < 0){
				let p = vec3.scaleAndAdd([0,0,0], p1, this.n, dist_point_plane(p1, this.constants));
				let p_rel = vec3.subtract([0,0,0], p, this.p);
				if(Math.abs(vec3.dot(p_rel, this.dir.x)) <= this.w && Math.abs(vec3.dot(p_rel, this.dir.y)) <= this.h){
					if(this.isgrnd)
						s2[n*IND.FPP + IND.LIF] = 0;
					let v = s2.slice(n*IND.FPP + IND.VEL, n*IND.FPP + IND.VEL + 3);
					let v_perp = vec3.scale([0,0,0], this.n, vec3.dot(v, this.n));
					vec3.scaleAndAdd(v, vec3.subtract([0,0,0], v, v_perp), v_perp, this.coeff);
					for(let i = 0; i < 3; i++){
						s2[n*IND.FPP + IND.POS + i] = p[i];
						s2[n*IND.FPP + IND.VEL + i] = v[i];
					}
				}
			}
		}
	}

	get_buf_data(s){
		return this.data;
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
