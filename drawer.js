class TriDrawer{
	constructor(shader_ind, data, light){
		this.sh = shader_ind;
		this.fpv = 10;
		this.v_len = data.length/this.fpv;

		let buffer = new Float32Array(data);
		this.fsize = buffer.BYTES_PER_ELEMENT;

		this.gl_buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.gl_buf);
		gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);

		switch_shader(this.sh);
		this.a_Position = gl.getAttribLocation(gl.program, 'a_Position');
		gl.vertexAttribPointer(this.a_Position, 3, gl.FLOAT, false, this.fsize*this.fpv, 0);
		gl.enableVertexAttribArray(this.a_Position);

		this.a_Color = gl.getAttribLocation(gl.program, 'a_Color');
		gl.vertexAttribPointer(this.a_Color, 4, gl.FLOAT, false, this.fsize*this.fpv, 3*this.fsize);
		gl.enableVertexAttribArray(this.a_Color);

		this.a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
		gl.vertexAttribPointer(this.a_Normal, 3, gl.FLOAT, false, this.fsize*this.fpv, 7*this.fsize);
		gl.enableVertexAttribArray(this.a_Normal);

		this.u_Light = gl.getUniformLocation(gl.program, 'u_Light');
		this.u_Diffuse = gl.getUniformLocation(gl.program, 'u_Diffuse');
		gl.uniform4fv(this.u_Light, light);
		gl.uniform1f(this.u_Diffuse, .025);
	}

	set_light = function(light){
		switch_shader(this.sh);
		gl.uniform4fv(this.u_Light, light);
	}

	buffer_data = function(start_ind, data){
		gl.bindBuffer(gl.ARRAY_BUFFER, this.gl_buf);
		gl.bufferSubData(gl.ARRAY_BUFFER, start_ind, data);
	}

	draw(){
		gl.bindBuffer(gl.ARRAY_BUFFER, this.gl_buf);
		switch_shader(this.sh);
		gl.vertexAttribPointer(this.a_Position, 3, gl.FLOAT, false, this.fsize*this.fpv, 0);
		gl.vertexAttribPointer(this.a_Color, 4, gl.FLOAT, false, this.fsize*this.fpv, 3*this.fsize);
		gl.vertexAttribPointer(this.a_Normal, 3, gl.FLOAT, false, this.fsize*this.fpv, 7*this.fsize);
		gl.drawArrays(gl.TRIANGLES, 0, this.v_len);
	}
}

class PointDrawer{
	constructor(shader_ind, data){
		this.sh = shader_ind;
		this.fpv = 8;
		this.v_len = data.length/this.fpv;

		let buffer = new Float32Array(data);
		this.fsize = buffer.BYTES_PER_ELEMENT;

		this.gl_buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.gl_buf);
		gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_DRAW);

		switch_shader(this.sh);
		this.a_Position = gl.getAttribLocation(gl.program, 'a_Position');
		gl.vertexAttribPointer(this.a_Position, 3, gl.FLOAT, false, this.fsize*this.fpv, 0);
		gl.enableVertexAttribArray(this.a_Position);

		this.a_Color = gl.getAttribLocation(gl.program, 'a_Color');
		gl.vertexAttribPointer(this.a_Color, 4, gl.FLOAT, false, this.fsize*this.fpv, 3*this.fsize);
		gl.enableVertexAttribArray(this.a_Color);

		this.a_Size = gl.getAttribLocation(gl.program, 'a_Size');
		gl.vertexAttribPointer(this.a_Size, 1, gl.FLOAT, false, this.fsize*this.fpv, 7*this.fsize);
		gl.enableVertexAttribArray(this.a_Size);
	}

	buffer_data = function(start_ind, data){
		gl.bindBuffer(gl.ARRAY_BUFFER, this.gl_buf);
		gl.bufferSubData(gl.ARRAY_BUFFER, start_ind, data);
	}

	draw(){
		gl.bindBuffer(gl.ARRAY_BUFFER, this.gl_buf);
		switch_shader(this.sh);
		gl.vertexAttribPointer(this.a_Position, 3, gl.FLOAT, false, this.fsize*this.fpv, 0);
		gl.vertexAttribPointer(this.a_Color, 4, gl.FLOAT, false, this.fsize*this.fpv, 3*this.fsize);
		gl.vertexAttribPointer(this.a_Size, 1, gl.FLOAT, false, this.fsize*this.fpv, 7*this.fsize);
		gl.drawArrays(gl.POINTS, 0, this.v_len);
	}
}