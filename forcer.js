class FireForcer{
	constructor(center, radius, height, force, num){
		this.num = num
		this.c = center;
		this.r = radius;
		this.h = height;
		this.f = force;

		this.data_len = 0;
	}

	apply_force(s){
		for(let n = 0; n < this.num; n++){
			let p = s.slice(n*IND.FPP + IND.POS, n*IND.FPP + IND.POS + 3);
			vec3.subtract(p, p, this.c);
			let heat_mag = map(p[2], [0, this.h], [map(mag(p.slice(0, 2)), [0, this.r], [this.f, this.f/2]), 0]);
			heat_mag = heat_mag > 0 ? heat_mag : 0;
			let f = vec3.scale([0,0,0], [0, 0, 1], heat_mag);
			for(let i = 0; i < f.length; i++){
				s[n*IND.FPP + IND.FOR + i] += f[i];
			}
		}
	}
}

class BoidForcer{
	constructor(co_f, al_f, sp_f, av_f, d, speed, center, radius, num){
		this.num = num;
		this.s = speed;
		this.c = center;
		this.r = radius;
		this.d = d;
		this.f = {
			co: co_f,
			al: al_f,
			sp: sp_f,
			av: av_f
		};

		let iso = gen_iso(2, 'TRI');
		let tri = [];
		let color = [1, 1, 1, 1];
		for(let i = 0; i < iso.length; i++){
			tri = tri.concat(vec3.scaleAndAdd([0,0,0], this.c, iso[i], this.r));
			tri = tri.concat(color);
			tri.push(0);
		}

		this.data = [tri, []];
		this.data_len = [tri.length, 0];
	}

	apply_force(s){
		let p = [];
		let v = [];
		for(let n = 0; n < this.num; n++){
			let f = [0, 0, 0];
			let co = [0, 0, 0];
			let al = [0, 0, 0];
			let sp = [0, 0, 0];
			let av = [0, 0, 0];
			let count = 0;
			for(let i = 0; i < this.num; i++){
				if(n == 0){
					p.push(s.slice(i*IND.FPP + IND.POS, i*IND.FPP + IND.POS + 3));
					v.push(s.slice(i*IND.FPP + IND.VEL, i*IND.FPP + IND.VEL + 3));
				}
				let p_diff = vec3.subtract([0,0,0], p[n], p[i]);
				let d = mag(p_diff);
				if(d < this.d && i != n){
					count++;
					co = vec3.add([0,0,0], co, p[i]);
					al = vec3.add([0,0,0], al, v[i]);
					vec3.scaleAndAdd(sp, sp, vec3.normalize([0,0,0], p_diff), map(d, [0, this.d], [this.f.sp, 0]));
				}
			}
			vec3.subtract(av, p[n], this.c);
			let d_sph = mag(av) - this.r;
			if(d_sph < this.d){
				av = vec3.scale([0,0,0], vec3.normalize([0,0,0], av), this.f.av*(this.d - d_sph)/this.d);
				f = vec3.add([0,0,0], f, av);
			}
			if(count > 0){
				vec3.scale(co, co, 1/count);
				vec3.scale(co, vec3.normalize([0,0,0], vec3.subtract([0,0,0], co, p[n])), this.f.co);
				vec3.scale(sp, vec3.normalize([0,0,0], sp), this.f.sp);
				vec3.scale(al, vec3.normalize([0,0,0], vec3.subtract([0,0,0], vec3.scale([0,0,0], vec3.normalize([0,0,0], al), this.s), v[n])), this.f.al);
				for(let j = 0; j < 3; j++){
					f[j] += co[j] + al[j] + sp[j]; 
				}
			}
			for(let i = 0; i < f.length; i++){
				s[n*IND.FPP + IND.FOR + i] += f[i];
			}
		}
	}

	get_buf_data(s){
		return this.data;
	}
}

class SpringForcer{
	constructor(length, strength, damping, ind_a, ind_b){
		this.len = length;
		this.str = strength;
		this.dmp = damping;
		this.inds = [ind_a, ind_b];

		this.data_len = [0, FPV*2];
	}

	apply_force(s){
		let pos_diff = vec3.subtract([0,0,0], s.slice(this.inds[0]*IND.FPP + IND.POS, this.inds[0]*IND.FPP + IND.POS + 3), s.slice(this.inds[1]*IND.FPP + IND.POS, this.inds[1]*IND.FPP + IND.POS + 3));
		let vel_diff = vec3.subtract([0,0,0], s.slice(this.inds[0]*IND.FPP + IND.VEL, this.inds[0]*IND.FPP + IND.VEL + 3), s.slice(this.inds[1]*IND.FPP + IND.VEL, this.inds[1]*IND.FPP + IND.VEL + 3));
		if(mag(pos_diff) == 0)
			pos_diff = APRX_0.slice();
		if(mag(vel_diff) == 0)
			vel_diff = APRX_0.slice();
		let d = mag(pos_diff) - this.len;
		let dir = vec3.normalize([0,0,0], pos_diff);
		vec3.scale(vel_diff, dir, vec3.dot([0,0,0], vel_diff, dir));

		let f = vec3.scale([0,0,0], dir, this.str*Math.pow(d, 2)*Math.sign(d) - (vec3.dot([0,0,0], vel_diff, dir) > 0 ? -1 : 1)*mag(vel_diff)*this.dmp);
		for(let i = 0; i < this.inds.length; i++){
			for(let j = 0; j < f.length; j++){
				s[this.inds[i]*IND.FPP + IND.FOR + j] += (i == 0 ? -1 : 1)*f[j];
			}
		}
	}

	get_buf_data(s){
		let lin = [];
		let color = [1, 1, 1, .5];
		for(let i = 0; i < this.inds.length; i++){
			for(let j = 0; j < 3; j++){
				lin.push(s[this.inds[i]*IND.FPP + IND.POS + j]);
			}
			for(let j = 0; j < 4; j++){
				lin.push(color[j]);
			}
			lin.push(0);
		}
		return [[], lin];
	}
}

class AttractionForcer{
	constructor(pos, force, num){
		this.num = num;
		this.p = pos;
		this.f = force;

		this.data_len = 0;
	}

	set_force(force){
		this.f = force;
	}

	apply_force(s){
		for(let n = 0; n < this.num; n++){
			let p = s.slice(n*IND.FPP + IND.POS, n*IND.FPP + IND.POS + 3);
			let f = vec3.scale([0,0,0], vec3.normalize([0,0,0], vec3.subtract([0,0,0], this.p, p)), this.f);
			for(let i = 0; i < f.length; i++){
				s[n*IND.FPP + IND.FOR + i] += f[i];
			}
		}
	}
}

class SingleForcer{
	constructor(force, particle_ind){
		this.ind = particle_ind;
		this.f = force;

		this.data_len = 0;
	}

	set_force(force){
		this.f = force;
	}

	apply_force(s){
		for(let i = 0; i < this.f.length; i++){
			s[this.ind*IND.FPP + IND.FOR + i] += this.f[i];
		}
	}

}

class AllForcer{
	constructor(magnitude, direction, num){
		this.num = num;
		this.mag = Math.abs(magnitude);
		this.dir = vec3.normalize([0,0,0], direction);

		this.data_len = 0;
	}

	set_mag(magnitude){
		this.mag = Math.abs(magnitude);
	}

	set_dir(direction){
		this.dir = vec3.normalize([0,0,0], direction);
	}

	apply_force(s){
		for(let n = 0; n < this.num; n++){
			let f = vec3.scale([0,0,0], this.dir, this.mag);
			for(let i = 0; i < f.length; i++){
				s[n*IND.FPP + IND.FOR + i] += f[i];
			}
		}
	}
}

class GravityForcer{
	constructor(val, num){
		this.g = val;
		this.num = num;

		this.data_len = 0;
	}

	apply_force(s){
		for(let n = 0; n < this.num; n++){
			let f = [0, 0, this.g*s[n*IND.FPP + IND.MAS]];
			for(let i = 0; i < f.length; i++){
				s[n*IND.FPP + IND.FOR + i] += f[i];
			}
		}
	}
}

class DragForcer{
	constructor(val, num){
		this.v = -1*Math.abs(val);
		this.num = num;
		this.max = 10000;

		this.data_len = 0;
	}

	apply_force(s){
		for(let n = 0; n < this.num; n++){
			let v = s.slice(n*IND.FPP + IND.VEL, n*IND.FPP + IND.VEL + 3);
			if(mag(v) > 0){
				let f = vec3.scale([0,0,0], vec3.normalize([0,0,0], v), this.v*Math.pow(mag(v), 2));
				for(let i = 0; i < f.length; i++){
					if(!isFinite(f[i]))
						f[i] = Math.sign(f[i])*this.max;
					s[n*IND.FPP + IND.FOR + i] += f[i];
				}
			}
		}
	}
}