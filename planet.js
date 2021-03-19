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