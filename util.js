//find magnitude of vector
function mag(vec){ 
	let s = 0;
	for(let i = 0; i < vec.length; i++)
		s += Math.pow(vec[i], 2);
	return Math.sqrt(s);
}

//dist between two vectors
function dist(a, b){
	let s = 0;
	for(let i = 0; i < a.length; i++)
		s += Math.pow(a[i] - b[i], 2);
	return Math.sqrt(s);
}

//find midpoint of two vectors
function midpoint(a, b){ 
	let o = [];
	for(let i = 0; i < a.length; i++)
		o.push((a[i] + b[i])/2);
	return o;
}

// map v from bounds a to bounds b
function map(v, a, b){
	return (v - a[0])/(a[1] - a[0])*(b[1] - b[0]) + b[0];
}

//find distance between point and plane
function dist_point_plane(pt, cnst){
	return (cnst[0]*pt[0] + cnst[1]*pt[1] + cnst[2]*pt[2] + cnst[3])/Math.sqrt(cnst[0]*cnst[0] + cnst[1]*cnst[1] + cnst[2]*cnst[2]);
}

//find distance between point and line defined by two points
function dist_point_line(pt, ln_0, ln_1){
	return mag(cross3(sub(pt, ln_0), sub(pt, ln_1)))/mag(sub(ln_1, ln_0));

}

//generate an isosphere with given iterations
function gen_iso(iter){ 
	//init base with 20 sides
	let f = (1.0 + Math.sqrt(5.0)) / 2.0; 
	let v = [[-1,f,0],[1,f,0],[-1,-f,0],
			 [1,-f,0],[0,-1,f],[0,1,f],
			 [0,-1,-f],[0,1,-f],[f,0,-1],
			 [f,0,1],[-f,0,-1],[-f,0,1]];
	let t = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
			 [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
			 [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
			 [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
	for(let i = 0; i < v.length; i++)
		vec3.normalize(v[i], v[i]);

	//iteratively convert every one triangle into 4 and normalize vertices
	for(let i = 0; i < iter; i++){
		let n_v = [];
		let n_t = [];
		for(let j = 0; j < t.length; j++){
			let a = vec3.normalize([0,0,0], midpoint(v[t[j][0]], v[t[j][1]]));
			let b = vec3.normalize([0,0,0], midpoint(v[t[j][1]], v[t[j][2]]));
			let c = vec3.normalize([0,0,0], midpoint(v[t[j][0]], v[t[j][2]]));
			let l = n_v.length;

			for(let k = 0; k < 3; k++)
				n_v.push(v[t[j][k]]);
			n_v = n_v.concat([a,b,c]);
			n_t = n_t.concat([[l+0,l+3,l+5]],[[l+1,l+4,l+3]],
							 [[l+2,l+5,l+4]],[[l+3,l+4,l+5]]);
		}
		v = n_v.slice();
		t = n_t.slice();
	}

	let tlen = 9;
	let o = new Float32Array(t.length*tlen);
	for(let i = 0; i < t.length; i++){
		for(let j = 0; j < 3; j++){
			for(let l = 0; l < 3; l++){
				o[i*tlen + j*3 + l] = v[t[i][j]][l];
			}
		}
	}
	return o;
}