let paused = false;
let fovy = 70*(Math.PI/180);

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

	let boid_num = 90;
	let boid_bound = 3.5;
	let boid_center = [-7, 7, boid_bound];
	let boid_radius = 1.5;
	let boid_sys = {
		num: boid_num,
		F: [
			new AllForcer(0, [1, 0, 0], boid_num),
			new AttractionForcer(boid_center, 0, boid_num),
			new BoidForcer(8, 6, 8, 50, 1.5, 3, boid_center, boid_radius, boid_num),
			new DragForcer(.3, boid_num)
		],
		C: [
			new SphereConstraint(boid_center, boid_radius, .9, boid_num),
			new BoundConstraint(0, -boid_bound + boid_center[0], boid_bound + boid_center[0], boid_num),
			new BoundConstraint(1, -boid_bound + boid_center[1], boid_bound + boid_center[1], boid_num),
			new AxisConstraint(2, -1, 0, 1, boid_num),
			new AxisConstraint(2, 1, 2*boid_bound, 1, boid_num)
		],
		init: function(){
			let p = [];
			let v = [];
			let f = [];
			let m = [map(Math.random(), [0, 1], [5, 10])];
			let s = [map(Math.random(), [0, 1], [40, 80])];
			let l = 0;
			let c = [.5, .5, .5, 1];
			c[Math.floor(Math.random()*3)] = 1;
			for(let i = 0; i < 3; i++){
				p.push(map(Math.random(), [0, 1], [-boid_bound, boid_bound]) + boid_center[i]);
				v.push(map(Math.random(), [0, 1], [-2, 2]));
				f.push(0);
			}
			return p.concat(v, f, m, s, l, c);
		}
	};

	let fire_num = 700;
	let fire_bound = 3.5;
	let fire_center = [-5, -5, 0];
	let fire_radius = 1;
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
		let p = vec3.add([0,0,0], fire_center, [Math.cos(angle)*radius, Math.sin(angle)*radius, 0]);
		let v = vec3.scale([0,0,0], vec3.normalize([0,0,0], [Math.random()*1 - .5, Math.random()*1 - .5, 1]), Math.random()*4 + 1);
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

	let rad2 = Math.pow(2, .5);
	let sphere_center = [-2.5, 3, -2];
	let tetra_num = 10;
	let spring_num = tetra_num*4;
	let spring_bound = 7;
	let spring_center = [7.5, 6.5, spring_bound];
	let spring_spawn = [-2, -4, 5.5];
	let spring_sys = {
		num: spring_num,
		F: [
			new AllForcer(0, [1, 0, 0], spring_num),
			new AttractionForcer(vec3.add([0,0,0], sphere_center, spring_center), 0, spring_num),
			new GravityForcer(-9.8, spring_num),
			new DragForcer(.3, spring_num)
		],
		C: [
			new WallConstraint([.25, 0, 1], [0, 1, 0], vec3.add([0,0,0], [-2.5, -4, 4], spring_center), 2, 3, .9, spring_num),
			new WallConstraint([0, .25, 1], [1, 0, 0], vec3.add([0,0,0], [2.5, -4, 2], spring_center), 2, 3, .9, spring_num),
			new WallConstraint([-.4, 0, 1], [0, 1, 0], vec3.add([0,0,0], [2.5, 1, 0], spring_center), 2, 3, .9, spring_num),

			new WallConstraint([0, 0, 1], [1, 1, 0], vec3.add([0,0,0], [-2, 3, -5], spring_center), 2.5, 2.5, .9, spring_num),
			new WallConstraint([1, 1, 0], [0, 0, 1], vec3.add([0,0,0], [-2 + 1.25*rad2, 3 + 1.25*rad2, -6], spring_center), 1, 2.5, .9, spring_num),
			new WallConstraint([-1, -1, 0], [0, 0, 1], vec3.add([0,0,0], [-2 - 1.25*rad2, 3 - 1.25*rad2, -6], spring_center), 1, 2.5, .9, spring_num),
			new WallConstraint([-1, 1, 0], [0, 0, 1], vec3.add([0,0,0], [-2 - 1.25*rad2, 3 + 1.25*rad2, -6], spring_center), 1, 2.5, .9, spring_num),
			new WallConstraint([1, -1, 0], [0, 0, 1], vec3.add([0,0,0], [-2 + 1.25*rad2, 3 - 1.25*rad2, -6], spring_center), 1, 2.5, .9, spring_num),

			new SphereConstraint(vec3.add([0,0,0], sphere_center, spring_center), 2, .9, spring_num),

			new AxisConstraint(0, -1, -spring_bound + spring_center[0], .9, spring_num),
			new AxisConstraint(0, 1, spring_bound + spring_center[0], .9, spring_num),
			new AxisConstraint(1, -1, -spring_bound + spring_center[1], .9, spring_num),
			new AxisConstraint(1, 1, spring_bound + spring_center[1], .9, spring_num),
			new AxisConstraint(2, -1, 0, .5, spring_num),
			new AxisConstraint(2, 1, 2*spring_bound, .5, spring_num)
		],
		init: function(){
			let p = vec3.add([0,0,0], vec3.add([0,0,0], spring_spawn, spring_center), [Math.random(), Math.random(), Math.random()]);
			let v = [0, 0, 0];
			let f = [0, 0, 0];
			let m = 5;
			let s = 0;
			let l = 0;
			let c = [1, 1, 1, 1];
			return p.concat(v, f, m, s, l, c);
		}
	}
	let connect_ind = [[0, 1], [1, 2], [2, 0], [0, 3], [1, 3], [2, 3]];
	for(let i = 0; i < tetra_num; i++){
		let spring_len = map(Math.random(), [0, 1], [.75, 1.25]);
		for(let j = 0; j < connect_ind.length; j++){
			spring_sys.F.push(new SpringForcer(spring_len, 9000, 110, connect_ind[j][0] + i*4, connect_ind[j][1] + i*4));
		}
	}

	let player_num = 1;
	let player_bound = 30;
	let player_pos = [-5, -8, 4];
	let player_sys = {
		num: player_num,
		F: [
			new SingleForcer([0, 0, 0], 0),
			new GravityForcer(-9.8, player_num),
			new DragForcer(.01, player_num)
		],
		C: [
			new AxisConstraint(0, -1, -player_bound, .95, player_num),
			new AxisConstraint(0, 1, player_bound, .95, player_num),
			new AxisConstraint(1, -1, -player_bound, .95, player_num),
			new AxisConstraint(1, 1, player_bound, .95, player_num),
			new AxisConstraint(2, -1, 0, .95, player_num),
			new AxisConstraint(2, 1, 2*player_bound, .95, player_num)
		],
		init: function(){
			let p = player_pos;
			let v = [0, 0, 0];
			let f = [0, 0, 0];
			let m = 50;
			let s = 0;
			let l = 0;
			let c = [0, 0, 0, 1];
			return p.concat(v, f, m, s, l, c);
		}
	}

	cam = new CameraController(player_pos, [0, 0, 3], .01);


	let SYS_IND = {
		PLAYER: 0,
		FIRE: 1
	}
	part_sys = [
		new PartSys(player_sys.num, player_sys.F, player_sys.C, player_sys.init),
		new PartSys(boid_sys.num, boid_sys.F, boid_sys.C, boid_sys.init),
		new PartSys(fire_sys.num, fire_sys.F, fire_sys.C, fire_sys.init),
		new PartSys(spring_sys.num, spring_sys.F, spring_sys.C, spring_sys.init)
	];
	for(let i = 0; i < part_sys.length; i++){
		part_sys[i].init();
	}

	drawers = [
		new Drawer([1, 0, 0], [part_sys[0].num, part_sys[0].FC_num.tri, part_sys[0].FC_num.lin], [gl.POINTS, gl.TRIANGLES, gl.LINES]),
		new Drawer([2, 0, 0], [part_sys[1].num, part_sys[1].FC_num.tri, part_sys[1].FC_num.lin], [gl.POINTS, gl.TRIANGLES, gl.LINES]),
		new Drawer([3, 0, 0], [part_sys[2].num, part_sys[2].FC_num.tri, part_sys[2].FC_num.lin], [gl.POINTS, gl.TRIANGLES, gl.LINES]),
		new Drawer([1, 0, 0], [part_sys[3].num, part_sys[3].FC_num.tri, part_sys[3].FC_num.lin], [gl.POINTS, gl.TRIANGLES, gl.LINES]),
		new Drawer([0], [grid.length/FPV], [gl.TRIANGLES])
	];
	drawers[drawers.length - 1].buffer_data(0, new Float32Array(grid));

	model_matrix = mat4.create();
	view_matrix = mat4.create();
	proj_matrix = mat4.create();
	mat4.perspective(proj_matrix, fovy, c.width/c.height, .01, 500);
	
	u_ModelMatrix = [];
	u_ViewMatrix = [];
	u_ProjMatrix = [];
	mvp_shaders = [0, 1, 2, 3];
	for(let i = 0; i < mvp_shaders.length; i++){
		switch_shader(mvp_shaders[i]);
		u_ModelMatrix.push(gl.getUniformLocation(gl.program, 'u_ModelMatrix'));
		u_ViewMatrix.push(gl.getUniformLocation(gl.program, 'u_ViewMatrix'));
		u_ProjMatrix.push(gl.getUniformLocation(gl.program, 'u_ProjMatrix'));
		
		gl.uniformMatrix4fv(u_ModelMatrix[i], false, model_matrix);
		gl.uniformMatrix4fv(u_ViewMatrix[i], false, view_matrix);
		gl.uniformMatrix4fv(u_ProjMatrix[i], false, proj_matrix);
	}

	let timestep = 1000/60;
	var tick = function(){
		
		let strafe_force = cam.strafe(timestep);
		if(strafe_force != undefined){
			part_sys[SYS_IND.PLAYER].F[0].set_force(strafe_force);
		}
		if(!paused){
			for(let i = 0; i < part_sys.length; i++){
				part_sys[i].applyAllForces(part_sys[i].s1, part_sys[i].F);
				part_sys[i].solver(timestep);
				part_sys[i].doConstraint(part_sys[i].s1, part_sys[i].s2, part_sys[i].C);
				part_sys[i].render(drawers[i]);
				part_sys[i].swap();
			}
		}

		mat4.lookAt(view_matrix, 
			vec3.add([0, 0, 0], cam.pos, part_sys[SYS_IND.PLAYER].s2.slice(0, 3)),
			vec3.add([0, 0, 0], cam.foc, part_sys[SYS_IND.PLAYER].s2.slice(0, 3)),
			[0, 0, 1]);
		for(let i = 0; i < mvp_shaders.length; i++){
			switch_shader(mvp_shaders[i]);
			gl.uniformMatrix4fv(u_ViewMatrix[i], false, view_matrix);
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
		mat4.perspective(proj_matrix, fovy, c.width/c.height, .01, 500);
		for(let i = 0; i < mvp_shaders.length; i++){
			switch_shader(mvp_shaders[i]);
			gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, 'u_ProjMatrix'), false, proj_matrix);
		}
	}
}