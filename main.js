paused = false;
fovy = 85*(Math.PI/180);

INPUT = {
	W: false,
	A: false,
	S: false,
	D: false,
	SPACE: false,
};

function main(){
	c = document.getElementById('canvas');
	c.width = window.innerWidth*window.devicePixelRatio;
	c.height = window.innerHeight*window.devicePixelRatio;
	setup_gl(c);

	planet = new Planet([0, 0, 0], 5*Math.pow(10, 16), 300);
	player = new PlayerController([0, 0, 350], .01, 60, 2.5*Math.pow(10, 5), .025);
	let player_num = 1;
	let player_bound = 30;
	let player_sys = {
		num: player_num,
		F: [
			new SingleForcer([0, 0, 0], 0),
			new DragForcer(.05, player_num)
		].concat(planet.F),
		C: [],
		init: function(){
			let p = player.pos;
			let v = [0, 0, 0];
			let f = [0, 0, 0];
			let m = 90;
			let s = 0;
			let l = 0;
			let c = [0, 0, 0, 1];
			return p.concat(v, f, m, s, l, c);
		}
	}

	PLAYER_SYS = 0;
	part_sys = [
		new PartSys(player_sys.num, player_sys.F, player_sys.C, player_sys.init)
	];
	for(let i = 0; i < part_sys.length; i++){
		part_sys[i].init();
	}

	drawers = [
		new TriDrawer(1, planet.terrain_data, [0, -250, 1500, 0]),
		new TriDrawer(1, planet.ocean_data, [0, -250, 1500, 0])
	];

	model_matrix = mat4.create();
	view_matrix = mat4.create();
	proj_matrix = mat4.create();
	mat4.perspective(proj_matrix, fovy, c.width/c.height, .1, 5000);
	mat4.lookAt(view_matrix, [0, -600, 0], [0, 0, 0], [0, 0, 1]);
	
	u_ModelMatrix = [];
	u_ViewMatrix = [];
	u_ProjMatrix = [];
	mvp_shaders = [0, 1];
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

		if(!paused){
			let player_pos = part_sys[PLAYER_SYS].s1.slice(0, 3);
			part_sys[PLAYER_SYS].F[0].set_force(player.update(part_sys[PLAYER_SYS].s1, INPUT, vec3.normalize([0, 0, 0], player_pos)));
			part_sys[PLAYER_SYS].C = planet.update(player.head);
			for(let i = 0; i < part_sys.length; i++){
				part_sys[i].applyAllForces(part_sys[i].s1, part_sys[i].F);
				part_sys[i].solver(timestep);
				part_sys[i].doConstraint(part_sys[i].s1, part_sys[i].s2, part_sys[i].C);
				part_sys[i].swap();
			}
		}

		mat4.lookAt(view_matrix, player.head, vec3.add([0, 0, 0], player.head, player.dir), player.up);
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
		player.pointerlockchange(document.pointerLockElement == c);
	});

	c.onmousedown = function(e){
		this.requestPointerLock();
	}

	c.onmousemove = function(e){
		player.mousemove(e);
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
			INPUT.W = true;
			break;
		case 'A':
			INPUT.A = true;
			break;
		case 'S':
			INPUT.S = true;
			break;
		case 'D':
			INPUT.D = true;
			break;
		case ' ':
			INPUT.SPACE = true;
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
			INPUT.W = false;
			break;
		case 'A':
			INPUT.A = false;
			break;
		case 'S':
			INPUT.S = false;
			break;
		case 'D':
			INPUT.D = false;
			break;
		case ' ':
			INPUT.SPACE = false;
	}
}

document.body.onresize = function(){
	c.width = window.innerWidth*window.devicePixelRatio;
	c.height = window.innerHeight*window.devicePixelRatio;
	if(gl){
		gl.viewport(0, 0, c.width, c.height);
		mat4.perspective(proj_matrix, fovy, c.width/c.height, .1, 5000);
		for(let i = 0; i < mvp_shaders.length; i++){
			switch_shader(mvp_shaders[i]);
			gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, 'u_ProjMatrix'), false, proj_matrix);
		}
	}
}