class PlayerController{
	constructor(position, sensitivity, move_speed, jump_force, height){
		this.pos = position;
		this.dir = [1, 0, 0];
		this.up = [0, 0, 1];
		this.sens = sensitivity;
		this.speed = move_speed;
		this.jump = jump_force;
		this.height = height;

		this.mouse_locked = false;
	}

	pointerlockchange(lock_state){
		this.mouse_locked = lock_state;
	}

	mousemove(e){
		if(this.mouse_locked){
			let dx = this.sens * e.movementX;
			let dy = this.sens * e.movementY;

			let rotation = mat4.create();
			mat4.rotate(rotation, mat4.create(), -dx, this.up);
			mat4.rotate(rotation, rotation, -dy, vec3.cross([0,0,0], this.dir, this.up));
			vec3.transformMat4(this.dir, this.dir, rotation);
		}
	}

	update(state, input){
		let strafe = [0, 0, 0];
		let forward = vec3.normalize([0,0,0], vec3.scaleAndAdd([0,0,0], this.dir, this.up, -1*vec3.dot(this.dir, this.up)));
		let lateral = vec3.cross([0,0,0], forward, this.up);
		if(input.W)
			vec3.scaleAndAdd(strafe, strafe, forward, 1);
		if(input.A)
			vec3.scaleAndAdd(strafe, strafe, lateral, -1);
		if(input.S)
			vec3.scaleAndAdd(strafe, strafe, forward, -1);
		if(input.D)
			vec3.scaleAndAdd(strafe, strafe, lateral, 1);
		;
		vec3.scale(strafe, vec3.normalize(strafe, strafe), this.speed);

		let vel = state.slice(IND.VEL, IND.VEL + 3);
		let vel_d = vec3.normalize([0,0,0], vec3.cross([0,0,0], this.up, vec3.cross([0,0,0], vel, this.up)));
		vec3.scale(vel_d, vel_d, vec3.dot(vel, vel_d));
		vec3.subtract(vel_d, strafe, vel_d); 

		let force = [0, 0, 0];
		vec3.scale(force, vec3.normalize(vel_d, vel_d), vec3.length(vel_d)*10000); 

		if(input.SPACE){
			input.SPACE = false;
			vec3.scaleAndAdd(force, force, this.up, this.jump);
		}

		vec3.scaleAndAdd(this.pos, state.slice(IND.POS, IND.POS + 3), this.up, this.height);
		return force;
	}
}