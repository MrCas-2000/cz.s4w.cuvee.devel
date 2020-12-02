<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix = "c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="w" tagdir="/WEB-INF/tags"%>

<!DOCTYPE html>
<html>
<head>
	<w:dev-page-init/>
</head>
<body>
	<h2 style="color: red;">ValidateBox - Basic usage</h2>
	<div>
		<h4>MoneyNumberBox</h4>
<div class="easyui-panel" title="Register" style="width:100%;max-width:400px;padding:30px 60px;">
        <div style="margin-bottom:20px">
            <label for="username" class="label-top">User Name:</label>
            <input id="username" class="easyui-validatebox tb" data-options="required:true,validType:'length[3,10]',validateOnCreate:false,validateOnBlur:true">
        </div>
        <div style="margin-bottom:20px">
            <label for="email" class="label-top">Email:</label>
            <input id="email" class="easyui-validatebox tb" data-options="required:true,validType:'email',validateOnCreate:false,validateOnBlur:true">
        </div>
        <div style="margin-bottom:20px">
            <label for="url" class="label-top">Url:</label>
            <input id="url" class="easyui-validatebox tb" data-options="required:true,validType:'url',validateOnCreate:false,validateOnBlur:true">
        </div>
        <div style="margin-bottom:20px">
            <label for="phone" class="label-top">Phone:</label>
            <input id="phone" class="easyui-validatebox tb" data-options="required:true,validateOnCreate:false,validateOnBlur:true">
        </div>
    </div>
    <style scoped="scoped">
        .tb{
            width:100%;
            margin:0;
            padding:5px 4px;
            border:1px solid #ccc;
            box-sizing:border-box;
        }
    </style>
        </div>
</body>
</html>
