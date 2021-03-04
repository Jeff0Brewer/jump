class PlayerController{
	constructor(position, sensitivity, move_speed, jump_force, air_control){
		this.pos = position;
		this.sens = sensitivity;
		this.speed = move_speed;
		this.jump = jump_force;
		this.air_control = air_control;
		this.up = [0, 0, 1];
		this.dir = [1, 0, 0];
		this.for = [1, 0, 0];
		this.lat = vec3.cross([0,0,0], this.for, this.up);
		this.height = 2;
		this.head = vec3.scaleAndAdd([0,0,0], this.pos, this.up, this.height);

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
			mat4.rotate(rotation, rotation, -dy, this.lat);

			vec3.transformMat4(this.dir, this.dir, rotation);
		}
	}

	update(state, input, up){
		let up_da = Math.acos(vec3.dot(up, this.up));
		let up_dp = vec3.normalize([0,0,0], vec3.subtract([0,0,0], up, this.up));
		this.up = up;

		vec3.normalize(this.for, vec3.scaleAndAdd([0,0,0], this.dir, this.up, -1*vec3.dot(this.dir, this.up)));
		vec3.cross(this.lat, this.for, this.up);
		let rotation = mat4.create();
		mat4.rotate(rotation, rotation, -up_da*vec3.dot(up_dp, this.for), this.lat);
		vec3.transformMat4(this.dir, this.dir, rotation);

		this.pos = state.slice(IND.POS, IND.POS + 3);
		vec3.scaleAndAdd(this.head, this.pos, this.up, this.height);

		let move_force = [0, 0, 0];
		let strafe_vel = [0, 0, 0];
		if(input.W)
			vec3.scaleAndAdd(strafe_vel, strafe_vel, this.for, 1);
		if(input.A)
			vec3.scaleAndAdd(strafe_vel, strafe_vel, this.lat, -1);
		if(input.S)
			vec3.scaleAndAdd(strafe_vel, strafe_vel, this.for, -1);
		if(input.D)
			vec3.scaleAndAdd(strafe_vel, strafe_vel, this.lat, 1);
		vec3.scale(strafe_vel, vec3.normalize([0,0,0], strafe_vel), this.speed);

		let curr_vel = state.slice(IND.VEL, IND.VEL + 3);
		let curr_pll = vec3.normalize([0,0,0], vec3.cross([0,0,0], this.up, vec3.cross([0,0,0], curr_vel, this.up)));
		vec3.scale(curr_pll, curr_pll, vec3.dot(curr_vel, curr_pll));
		let vel_diff = vec3.subtract([0,0,0], strafe_vel, curr_pll);
	
		if(vec3.dot(vel_diff, strafe_vel) > 0)
			vec3.scale(move_force, vel_diff, 1000); 
		if(state[IND.LIF] > .1)
			return vec3.scale(move_force, move_force, this.air_control);

		if(input.SPACE){
			state[IND.LIF] += 1;
			input.SPACE = false;
			vec3.scaleAndAdd(move_force, move_force, this.up, this.jump);
		}

		return move_force;
	}
}