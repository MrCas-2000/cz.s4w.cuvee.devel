<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>

<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="w" tagdir="/WEB-INF/tags"%>
<!DOCTYPE html>
<html>
<head>
	<w:main-page-init/>
	<script type="text/javascript" src="${it.baseUri}/libs/app/js/login.js"></script>
</head>
<body>
	<w:main-page-topbar/>
	<div class="container-fluid h-100">
		<div class="row h-100" style="margin-top: 45px;">
			<div class="col order-2 col-sm-9 order-sm-1">
				<div class="text-center">
					<h1>&nbsp;</h1>
					<h3 style="color: coral;">Buriosca.cz - Buchler 2018</h3>
					<p>Databáze knih.</p>
					
					<h1>&nbsp;</h1>
				</div>			
			</div>
			<div class="col-12 order-1 col-sm-3 order-sm-2 bg-light">
				<div class="row display-1">&nbsp;</div>						
				<div class="row">
					<form action="javascript:void(0)" class="col-10 offset-md-1">
						<div class="form-group">
							<label for="fldUserName">${messages.get('DC-X-LOGIN0000000000')}:</label>
							<div class="input-group">
								<div class="input-group-prepend">
									<span class="input-group-text fa fa-user-o"></span>
								</div>
								<input type="text" class="form-control" id="fldUserName" name="userName" value="demo" >
							</div>							
						</div>
						<div class="form-group">
							<label for="fldPassword">${messages.get('DC-X-PASSWORD0000000')}:</label>
							<div class="input-group">
								<div class="input-group-prepend">
									<span class="input-group-text fa fa-lock"></span>
								</div>
								<input  type="password" class="form-control" id="fldPassword" name="password" value="demo" >
							</div>							
							 
						</div>						
						<p id="loginAlert" style="display: none; width: 100%; color: red; text-align: center;">
							${messages.get('DC-X-LOGIN_ERORR0000')}
						</p>
						<button id="loginBtn" class="btn btn-primary" style="width: 100px; height: 30px;" onclick="doLogin('${it.baseUri}')">
							${messages.get('DC-X-SIGNIN000000000')}
						</button>
					</form>
				</div>
				<div class="row display-1">&nbsp;</div>					 	
			</div>
		</div>
	</div>
</body>
</html>