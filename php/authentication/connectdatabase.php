<?php
session_start();
require_once('config.php');
// Connect to sql server

define('totalSem', 8);

if ($_POST['user_id'] !== null){
	$_SESSION['user_id'] = $_POST['user_id'];
	echo ("Done");
}

if (isset($_REQUEST['cmd'])){

	if ($_REQUEST['cmd'] == "getModules"){
		//Connect to database
		$db = new mysqli(DB_HOSTNAME, DB_USERID, DB_PASSWORD, DB_NAME);

		if ($db->connect_errno) {
			exit('Fail to connect to mysql server');
		}	

		$user_id = $db->escape_string($_REQUEST['matric']);
		if (!authenticate($user_id)){
			exit('not authenticated');
		}

		$query = "SELECT * FROM ".table."  WHERE user_id = '".$user_id."'";
		$res = $db->query($query);
		if (!$res) exit('Error retrieving');
		if (mysqli_num_rows($res) == 0){
			echo json_encode("");
		}else{
			$r = mysqli_fetch_row($res);	//matric, sem1, sem2, sem3, ..., sem8
			$returnList = array();
			for ($i = 1; $i <= totalSem; $i++){
				$moduleList = parseModules($r[$i]);
				array_push($returnList, $moduleList);
			}	
			echo json_encode($returnList);
		}
		$db->close();
	}

	if ($_REQUEST['cmd'] == "storeModules"){
		$db = new mysqli(DB_HOSTNAME, DB_USERID, DB_PASSWORD, DB_NAME);

		if ($db->connect_errno) {
			exit('Fail to connect to mysql server');
		}	

		$user_id = $db->escape_string($_REQUEST['matric']);

		if (!authenticate($user_id)){
			exit("not authenticated");
		}

		$modules = json_decode($_REQUEST['modules'], true);
		if (count($modules) != totalSem){
			exit('Invalid input');
		}

		$query = "SELECT * FROM USER WHERE user_id = '".$user_id."'";
		$res = $db->query($query);
		if (!$res) exit("Error retrieving");
		if (mysqli_num_rows($res) == 0){
			//insert
			$query = "INSERT INTO ".table."  VALUES('".$user_id."','".stringifyModules($modules[0],$db)."','".stringifyModules($modules[1],$db)."','".stringifyModules($modules[2],$db)."','".stringifyModules($modules[3],$db)."','".stringifyModules($modules[4],$db)."','".stringifyModules($modules[5],$db)."','".stringifyModules($modules[6],$db)."','".stringifyModules($modules[7],$db)."')";
		} else {
			//update
			$query = "UPDATE ".table." SET sem1='".stringifyModules($modules[0],$db)."',sem2='".stringifyModules($modules[1],$db)."',sem3='".stringifyModules($modules[2],$db)."',sem4='".stringifyModules($modules[3],$db)."',sem5='".stringifyModules($modules[4],$db)."',sem6='".stringifyModules($modules[5],$db)."',sem7='".stringifyModules($modules[6],$db)."',sem8='".stringifyModules($modules[7],$db)."' WHERE user_id = '".$user_id."'";
		}
		$res = $db->query($query);
		if (!$res) exit("Error updating");
		$db->close();
		echo json_encode("Success");
	}
}

function parseModules($list){
	return preg_split("/\,/", $list);
}

function stringifyModules($list, $db){
	$returnStr = "";
	for ($i = 0; $i < count($list); $i++){
		$returnStr .= $db->escape_string($list[$i]);
		if ($i != count($list) - 1){
			$returnStr .= ",";
		}
	}
	return $returnStr;
}

function authenticate($user_id){
	return ($user_id === $_SESSION['user_id']);
}
?>

