class CameraController{
	constructor(cam, focus, rot_speed){
		this.pos = cam;
		this.foc = focus;
		this.r_spd = rot_speed;
		this.locked = false;
		this.mouse = {
			x: 0,
			y: 0
		};
		this.strafe_sign = {
			lat: 0,
			for: 0
		};
		this.off = [0, 0, 0];
	}

	strafe(elapsed){
		if(this.locked){
			let force = 30000;
			let d = vec3.add([0,0,0], 
				vec3.scale([0,0,0], vec2.normalize([0,0], vec3.subtract([0,0,0], this.foc.slice(0, 2), this.pos.slice(0, 2))).concat([0]), this.strafe_sign.for*force*elapsed/1000), 
				vec3.scale([0,0,0], vec3.normalize([0,0,0], vec3.cross([0,0,0], vec3.subtract([0,0,0], this.foc, this.pos), [0, 0, 1])), this.strafe_sign.lat*force*elapsed/1000)
			);
			return d;
		}
	}

	add_strafe(s){
		this.strafe_sign.lat = Math.sign(this.strafe_sign.lat + s[0]);
		this.strafe_sign.for = Math.sign(this.strafe_sign.for + s[1]);
	}

	mousedown(e){
		this.mouse.x = e.clientX;
		this.mouse.y = e.clientY;
	}

	mousemove(e){
		if(this.locked){
			let dx = this.r_spd * e.movementX;
			let dy = this.r_spd * e.movementY;
			let dir = vec3.subtract([0,0,0], this.foc, this.pos);
			let ax = vec3.normalize([0,0,0], vec3.cross([0,0,0], dir, [0, 0, 1]));

			let rotation = mat4.create();
			mat4.rotate(rotation, mat4.create(), -dx, [0, 0, 1])
			mat4.rotate(rotation, rotation, -dy, ax)

			vec3.add(this.foc, this.pos, vec3.transformMat4([0, 0, 0], dir, rotation));

			this.mouse.x += e.movementX;
			this.mouse.y += e.movementY;
		}
	}
}
