'use strict';

/**
 *  ---> function is called as callback
 *  -> function is called normally
 *  IVLE user:
 		1. User.init:		
			token exists ---> initializedUser(delay) ---> getModulesLogin(delay)
			-> Transport.loadCookies (in plancontroller) load plan table which is stored in localstorage
			-> User.setInfo() -> User.reset -> main.initModules (in mainController) -> Modules.fetchData()
		2. Modules.fetchData();
			Modules.init() -> Modules.resetTable() -> Modules.reload();
		3. Modules.reload();
			token exists, but we don't need to send request for modules list
			use addModule() to add modules to modules table
			Sync plan table with modules table

	non-IVLE user:
		1. User.init():
			token dne 
			User.setInfo -> User.reset -> main.initModules (in mainController) -> Modules.fetchData();
		2. Modules.fetchData()
			Modules.init() -> Modules.resetTable() 
			-> Transport.loadCookies (in plancontroller) load plan table which is stored in localstorage
			-> Modules.reload() 
		3. Modules.reload()
			token dne, load modules list from cookie
			use addModule() to add modules to modules table
			Sync plan table with modules table

	AddModule, RemoveModule, ChangeType, ChangeState -> updateAllModules -> saveAllModules
	-> getType ---> updateType ---> verify
 **/

angular.module('core', ['angucomplete-alt', 'ngCookies', 'ui.sortable', 'LocalStorageModule']);
angular.module('core').controller('mainController', [ '$scope', 'Modules', 'User', 'SearchFilter', 'Transport',
	function($scope, Modules, User, SearchFilter, Transport) { 

		$scope.emptystring = '';

		$scope.stateToAdd = 'planned';

		Transport.noSemesters = 4;

		/**------------------ Modules list controller ---------------------------------*/

		$scope.modulesController = Modules;

		$scope.modules = [];

		$scope.initModules = function (admissionYear, major, callback) {
			/* change the number of semesters in plan table */
			if (admissionYear) {
				var startYear = parseInt(admissionYear[0]) * 10 + parseInt(admissionYear[1]);
				var passedYear = 15 - startYear;
				var remainingYear = 5 - passedYear;
				Transport.noSemesters = remainingYear * 2 - 2;
				Transport.currentSems = passedYear * 2 + 2;
			}


			Modules.fetchData(admissionYear, major, function (data) {
				$scope.modules = data;

				if (callback) {
					callback(data);
				}
			});
		};

		// Remove module
		$scope.removeModule = Modules.removeModule;

		// Change state of module from planned to taken and vice versa
		$scope.changeState = Modules.changeState;

		// Change type of modules,
		$scope.changeType = Modules.changeType;

		// Function to add new module
		$scope.addModule = function (item) {
			Modules.addModule(item.code, $scope.stateToAdd);
		};

		// Function to submit list of taken modules
		$scope.submit = function () {
			Modules.submit($scope.admissionYear, $scope.major, $scope.focusArea, function (data) {
			});
		};

		/**---------------  Certificate controller -------------------------------------**/

		$scope.user = User;

		/**
		 *  Give user service the power to reset the entire universe
		 **/
		$scope.user.reset = function (major, focusArea, admissionYear, callback) {
			$scope.initModules(admissionYear.code, major.code, callback);
		};

		$scope.user.init();

		/**
		 *  These 3 functions are for updating major, focusarea, adyear
		 **/
		$scope.changeMajor = function (selectedMajor) {
			$scope.user.displayMajor = selectedMajor.title;
		};

		$scope.changeFocusArea = function (selectedFocusArea) {
			$scope.user.displayFocusArea = selectedFocusArea.title;
		};

		$scope.changeAdmissionYear = function (selectedAdmissionYear) {
			$scope.user.displayAdmissionYear = selectedAdmissionYear.title;
		};

		/**------------------------- Search Filter controller ---------------------**/

		$scope.searchFilter = SearchFilter;

		$scope.modifyFilter = function (type) {
			if (type === 'ALL') {
				$scope.searchFilter.resetFilter();
			} else {
				$scope.searchFilter.set('type', type);
			}
		};

		/**------------------------- Template controller --------------------------**/

		$scope.generateTemplate = function () {
			$scope.hardcodedModules = [];

			$scope.hardcodedModules = getTemplatesMods(User.findItemByTitle(User.major.title, User.majorsList).code);

			$scope.user.setInfo(User.major.title, User.focusArea.title, User.admissionYear.title, '', '', function () {
				for(var i in $scope.hardcodedModules) {
					var module = $scope.hardcodedModules[i];

					Modules.addModule(module, 'taken', 'auto');
				}

				Modules.updateAllSelectedModules();
			});
		}
	}
]);

angular.module('core').controller('loginController', [ '$scope', 'User', 'Transport',
	function ($scope, User, Transport) {
		$scope.Input = {
			username: '',
			password: ''
		};

		$scope.login = function (Input) {
			User.login(Input.username, Input.password);
		};
	}
]);

angular.module('core').controller('planController', [ '$scope', 'Modules', 'localStorageService', 'SearchFilter', 'Transport', 'User',
	function ($scope, Modules, localStorageService, SearchFilter, Transport, User) {
		$scope.emptystring = '';

		$scope.stateToAdd = 'planned';

		/**----------------------- Module controller ----------------------------**/
		/* Create clone of modules factory */
		$scope.initModules = function (admissionYear, major) {
			Modules.fetchData(admissionYear, major, function (data) {
				$scope.modules = data;
			});
		};

		// Remove module
		$scope.removeModule = Modules.removeModule;

		// Change state of module from planned to taken and vice versa
		$scope.changeState = Modules.changeState;

		// Function to add new module
		$scope.addModule = function (item) {
			Modules.addModule(item.code, $scope.stateToAdd);
		};

		/* End */

		/**------------------------- Search Filter controller ---------------------**/

		$scope.searchFilter = SearchFilter;

		$scope.modifyFilter = function (type) {
			if (type === 'ALL') {
				$scope.searchFilter.resetFilter();
			} else {
				$scope.searchFilter.set('type', type);
			}
		};

		/**------------------------- Plan table controller ------------------------**/

		$scope.save = function () {
			// Update by save it to localStorage
			var plan = $scope.semester;

			localStorageService.set('plan', plan);

			if (User.matric) {
				localStorageService.set('userid', User.matric);
			} else {
				localStorageService.set('userid', 'nouser');
			}
		};

		/** 
		 *  MC Counter in plan table
		 *  Recompute mc after a module is added, removed or moved
		 **/
		$scope.computePlannedMC = function () {
			// Avoid conflict with old version of planner 
			while ($scope.semester.length < 10) {
				$scope.semester.push([]);
			}

			for(var i in $scope.semester) {
				$scope.plannedMC[i] = 0;

				var sem = $scope.semester[i];

				for(var j in sem) {
					var mod = sem[j];

					$scope.plannedMC[i] += parseInt(mod.mc);
				}
			}
		};

		$scope.semester = [[], [], [], [], [], [], [], [], [], []];
		$scope.semId = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
		$scope.showSemester = [ true, true, true, true, false, false, false, false, false, false ];
		$scope.plannedMC = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

		/**
		 *  Purpose: It makes sure modules in plan table are in sync with modules in list
		 * 			 Any module in plan table that is not found in list are to be removed
		 *			 Any planned module in the list that is not found in plan table are to be added
		 *  Assume:  Modules factory, Modules.visibleModules, Modules.added exists
		 **/
		Transport.sync = function () {
			// add module from plan table
			for(var i in Modules.visibleModules['ALL']) {
				var module = Modules.visibleModules['ALL'][i];

				if (module.state === 'planned') {
					$scope.addPlannedModule(module);
				}
			}

			// remove module from plan table
			for(var s in $scope.semester) {
				var modules = $scope.semester[s];
				for(var i = modules.length - 1;  i >= 0;  i--) {
					var module = modules[i];

					// if module is not in the list or its state is not planned then remove it;
					if (!Modules.added(module) || ((!Modules.getModuleByCode(module.code)) && (Modules.getModuleByCode(module.code).state === 'planned'))) {
						modules.splice(i, 1);
					}
				}
			}
		};

		/**
		 *  Track the number of semesters
		 **/ 
		$scope.$watch(function() {
			return Transport.noSemesters;
		}, function (newValue) {
			// Avoid conflict with old version of planner 
			while ($scope.semester.length < 10) {
				$scope.semester.push([]);
			}

			for(var i = 0;  i < 10;  i++) {
				$scope.showSemester[i] = false;
			}
			for(var i = 0;  i < newValue;  i++) {
				$scope.showSemester[i] = true;
			}

			// addd this to avoid hiding non-empty sem 
			for(var i = 9;  i >= 0;  i--) {
				if ($scope.semester[i].length != 0) {
					for(var j = i;  j >= 0;  j--) {
						$scope.showSemester[j] = true;
					}
				}
			}  

			var count = 10;
			var check = false;
			for(var i = 9;  i >= 0;  i--) {
				if ($scope.showSemester[i]) { check = true; }

				if (check) {
					$scope.semId[i] = count;
					count--;
				}
			}
		}); 

		$scope.loadPlanner = function () {
			// CHeck the cookie first
			var plan = localStorageService.get('plan');

			if (plan) {
				/* BRANCH: stored plan found */
				$scope.semester = plan;

				/* Avoid conflict with old version of planner */
				while ($scope.semester.length < 10) {
					$scope.semester.push([]);
				}

				// addd this to avoid hiding non-empty sem 
				for(var i = 9;  i >= 0;  i--) {
					if ($scope.semester[i].length != 0) {
						for(var j = i;  j >= 0;  j--) {
							$scope.showSemester[j] = true;
						}
					}
				}  
			} else {
				$scope.semester = [ [], [], [], [], [], [], [], [], [] ];
			}

			$scope.computePlannedMC();
		};

		/**
		 *
		 **/
		Transport.sync = function () {
			for(var i in Modules.visibleModules['ALL']) {
				var mod = Modules.visibleModules['ALL'][i];
				
				if (mod.state === 'planned') {
					$scope.addPlannedModule(mod);
				}
			}

			for(var s in $scope.semester) {
				var sem = $scope.semester[s];

				for(var i in sem) {
					var mod = sem[i];
					var res = Modules.getSelectedModuleByCode(mod.code);

					if ((!res) || (res.state !== 'planned')) {
						sem.splice(i, 1);
					}
				}
			}

			$scope.save();
		};

		/**
		 *  Load cookies
		 */
		Transport.loadCookies = function () {
			var token = getIVLEToken();
			var userid = localStorageService.get('userid');
			var plan = localStorageService.get('plan');

			if (userid) {
				if (token) {
					if (userid === User.matric) {
						$scope.loadPlanner();
					} else {
						/* BRANCH: stored plan not found */
						$scope.semester = [ [], [], [], [], [], [], [], [], [], [] ];

						$scope.computePlannedMC();
					}
				} else {
					if (userid === 'nouser') {
						$scope.loadPlanner();
					} else {
						/* BRANCH: stored plan not found */
						$scope.semester = [ [], [], [], [], [], [], [], [], [], [] ];

						$scope.computePlannedMC();
					}
				}
			} else {
				/* BRANCH: stored plan not found */
				$scope.semester = [ [], [], [], [], [], [], [], [], [], [] ];

				$scope.computePlannedMC();
			}

		}

		/**
		 *  Check if this module has been added to the table
		 **/
		var isAdded = function(module) {
			for(var i in $scope.semester) {
				for(var j in $scope.semester[i]) {
					var mod = $scope.semester[i][j];

					if (mod.code === module.code) {

						return true;
					}
				}
			}

			return false;
		}

		$scope.addPlannedModule = function (module) {

			if (!isAdded(module)) {
				var clone = {
					code: module.code,
					title: module.title,
					mc: module.mc
				};

				$scope.semester[0].push(clone);
				$scope.save();

				$scope.computePlannedMC();
			}
		};

		$scope.removePlannedModule = function (mod) {

			for(var s in $scope.semester) {
				var modules = $scope.semester[s];

				for(var i in modules) {
					var module = modules[i];

					if (module.code === mod.code) {
						modules.splice(i, 1);
						$scope.save();
						$scope.computePlannedMC();
						return;
					}
				}
			}

			$scope.computePlannedMC();
		};

		Modules.removePlannedModuleFromPlanTable = $scope.removePlannedModule;
		Modules.addPlannedModuleToPlanTable = $scope.addPlannedModule;

		/* Configuration for sortable angularjs */
		$scope.sortingLog = [];

		$scope.sortableOptions = {
			placeholder: "modholder",
			connectWith: ".semester",
			tolerance: 'intersect',
			update: function () {
				$scope.save();

				$scope.computePlannedMC();
			}
		};

		$scope.log = function () {
		};
	}
]);
