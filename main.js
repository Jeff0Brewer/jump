let paused = false;
let fovy = 70;

function main(){
	c = document.getElementById('canvas');
	c.width = window.innerWidth;
	c.height = window.innerHeight;
	setup_gl(c);

	let grid_size = 75;
	let s = 1.0;
	let z = -.001;
	let sq = [
		0, 0, z, 0, 0, 0, 1, 0,
		0, s, z, 0, 0, 0, 1, 0,
		s, s, z, 0, 0, 0, 1, 0,
		s, s, z, 0, 0, 0, 1, 0,
		0, 0, z, 0, 0, 0, 1, 0,
		s, 0, z, 0, 0, 0, 1, 0
	];
	let sq_ind = 0;
	let grid = [];
	for(let x = -grid_size/2*s; x < grid_size/2*s; x += s){
		for(let y = -grid_size/2*s; y < grid_size/2*s; y += s, sq_ind++){
			let b = .2*(sq_ind % 2);
			let off = [x, y, 0, b, b, b, 0, 0];
			for(let i = 0; i < sq.length; i++){
				grid.push(sq[i] + off[i % off.length]);
			}
		}
	}

	let fire_num = 500;
	let fire_bound = 10;
	let fire_center = [0, 0, 0];
	let fire_radius = .25;
	let fire_force = .6;
	let fire_mass = .02;
	let fire_size = 200;
	let fire_life = .75;
	let fire_map = function(val, bound){
		let colors = [[.7, .7, .25], [1, 1, .25], [1, .5, 0], [1, 0, 0], [.5, 0, 0], [.3, .3, .3], [0, 0, 0]];
		val = val < bound[0] ? bound[0] : val;
		val = val > bound[1] ? bound[1] : val;
		let per = (val - bound[0])/(bound[1] - bound[0]);

		let ind = Math.floor(per*(colors.length - 1));
		ind = ind > colors.length - 2 ? colors.length - 2 : ind;
		ind = ind < 0 ? 0 : ind;
		per = per*(colors.length - 1) - ind;
		let color = [];
		for(let i = 0; i < 3; i++){
			color.push(map(per, [0, 1], [colors[ind][i], colors[ind + 1][i]]));
		}
		return color;
	}
	let fire_init = function(){
		let angle = Math.random()*2*Math.PI;
		let radius = Math.random()*fire_radius;
		let p = add(fire_center, [Math.cos(angle)*radius, Math.sin(angle)*radius, 0]);
		let v = mult_scalar(norm([Math.random()*1 - .5, Math.random()*1 - .5, 1]), Math.random()*4 + 1);
		let f = [0, 0, 0];
		let m = fire_mass;
		let s = fire_size;
		let l = .2*fire_life*Math.random();
		let c = [1, 0, 0, 1];
		return p.concat(v, f, m, s, l, c);
	}
	let fire_sys = {
		num: fire_num,
		F: [
			new AllForcer(0, [1, 0, 0], fire_num),
			new FireForcer(fire_center, fire_radius, 3, fire_force, fire_num),
			new GravityForcer(-9.8, fire_num),
			new DragForcer(.002, fire_num)
		],
		C: [
			new FireConstraint(fire_life, fire_mass, fire_size, fire_map, fire_init, fire_num),
			new AxisConstraint(0, -1, -fire_bound + fire_center[0], .5, fire_num),
			new AxisConstraint(0, 1, fire_bound + fire_center[0], .5, fire_num),
			new AxisConstraint(1, -1, -fire_bound + fire_center[1], .5, fire_num),
			new AxisConstraint(1, 1, fire_bound + fire_center[1], .5, fire_num),
			new AxisConstraint(2, -1, 0, .5, fire_num),
			new AxisConstraint(2, 1, 2*fire_bound, .5, fire_num)
		],
		init: fire_init
	}

	cam = new CameraController([-5, -5, 3], [0, 0, 0], .8, .01);

	part_sys = [
		new PartSys(fire_sys.num, fire_sys.F, fire_sys.C, fire_sys.init)
	];
	for(let i = 0; i < part_sys.length; i++){
		part_sys[i].init();
	}

	drawers = [
		new Drawer([3, 0, 0], [part_sys[0].num, part_sys[0].FC_num.tri, part_sys[0].FC_num.lin], [gl.POINTS, gl.TRIANGLES, gl.LINES]),
		new Drawer([0], [grid.length/FPV], [gl.TRIANGLES])
	];
	drawers[drawers.length - 1].buffer_data(0, new Float32Array(grid));

	model_matrix = new Matrix4();
	view_matrix = new Matrix4();
	proj_matrix = new Matrix4();
	view_matrix.setLookAt(cam.pos[0], cam.pos[1], cam.pos[2], cam.foc[0], cam.foc[1], cam.foc[2], 0, 0, 1);
	proj_matrix.setPerspective(fovy, c.width/c.height, .01, 500);
	
	u_ModelMatrix = [];
	u_ViewMatrix = [];
	u_ProjMatrix = [];
	mvp_shaders = [0, 1, 2, 3];
	for(let i = 0; i < mvp_shaders.length; i++){
		switch_shader(mvp_shaders[i]);
		u_ModelMatrix.push(gl.getUniformLocation(gl.program, 'u_ModelMatrix'));
		u_ViewMatrix.push(gl.getUniformLocation(gl.program, 'u_ViewMatrix'));
		u_ProjMatrix.push(gl.getUniformLocation(gl.program, 'u_ProjMatrix'));
		
		gl.uniformMatrix4fv(u_ModelMatrix[i], false, model_matrix.elements);
		gl.uniformMatrix4fv(u_ViewMatrix[i], false, view_matrix.elements);
		gl.uniformMatrix4fv(u_ProjMatrix[i], false, proj_matrix.elements);
	}

	let timestep = 1000/60;
	var tick = function(){
		if(!paused){
			for(let i = 0; i < part_sys.length; i++){
				part_sys[i].applyAllForces(part_sys[i].s1, part_sys[i].F);
				part_sys[i].solver(timestep);
				part_sys[i].doConstraint(part_sys[i].s1, part_sys[i].s2, part_sys[i].C);
				part_sys[i].render(drawers[i]);
				part_sys[i].swap();
			}
		}

		cam.strafe(timestep);
		view_matrix.setLookAt(cam.pos[0], cam.pos[1], cam.pos[2], cam.foc[0], cam.foc[1], cam.foc[2], 0, 0, 1);
		for(let i = 0; i < mvp_shaders.length; i++){
			switch_shader(mvp_shaders[i]);
			gl.uniformMatrix4fv(u_ViewMatrix[i], false, view_matrix.elements);
		}

		draw();
	}
	setInterval(tick, timestep);

	window.addEventListener('keydown', key_down, false);
	window.addEventListener('keyup', key_up, false);

	document.addEventListener('pointerlockchange', function(){
		cam.locked = (document.pointerLockElement == c);
	})

	c.onmousedown = function(e){
		 this.requestPointerLock();
		cam.mousedown(e);
	}

	c.onmousemove = function(e){
		cam.mousemove(e)
	}
}

function draw(){
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	for(let i = 0; i < drawers.length; i++){
		drawers[i].draw();
	}
}

function key_down(e){
	let char = String.fromCharCode(e.keyCode);
	switch(char){
		case 'W':
			cam.add_strafe([0, 1]);
			break;
		case 'A':
			cam.add_strafe([-1, 0]);
			break;
		case 'S':
			cam.add_strafe([0, -1]);
			break;
		case 'D':
			cam.add_strafe([1, 0]);
			break;
		case 'R':
			if(!paused)
				for(let i = 0; i < part_sys.length; i++){
					part_sys[i].init();
				}
			break;
		case 'P':
			paused = !paused;
			break;
	}
}

function key_up(e){
	let char = String.fromCharCode(e.keyCode);
	switch(char){
		case 'W':
			cam.add_strafe([0, -1]);
			break;
		case 'A':
			cam.add_strafe([1, 0]);
			break;
		case 'S':
			cam.add_strafe([0, 1]);
			break;
		case 'D':
			cam.add_strafe([-1, 0]);
			break;
	}
}

document.body.onresize = function(){
	c.width = window.innerWidth;
	c.height = window.innerHeight;
	if(gl){
		gl.viewport(0, 0, c.width, c.height);
		proj_matrix.setPerspective(fovy, c.width/c.height, .01, 500);
		for(let i = 0; i < mvp_shaders.length; i++){
			switch_shader(mvp_shaders[i]);
			gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, 'u_ProjMatrix'), false, proj_matrix.elements);
		}
	}
}