/* global $ */
/* global angular */
var app = angular.module("SOSP", []);
console.log("App initialized");
app.controller("MainCtrl", ["$scope", "$http", function($scope, $http) {
    console.log("Controller initialized");
    var BASE_URL = "https://api.elsevier.com";
    BASE_URL = "../output.json?";
    $scope.auid_input = "0000-0001-9827-1834";
    var apikey = "f454eaac956f48b3c6a89d9bb814f9e4";
    $scope.loading = 0;

    $scope.auid_list = {};
    $scope.auid_list_error = [];

    // Set example categories
    $scope.categories = [{
        name: "dc:title",
        friendly_name: "title",
        id: 0
    }, {
        name: "prism:publicationName",
        friendly_name: "publicationName",
        id: 1
    }, {
        name: "prism:coverDisplayDate",
        friendly_name: "coverDisplayDate",
        id: 2
    }, {
        name: "prism:issn",
        friendly_name: "issn",
        id: 3
    }, {
        name: "citedby-count",
        friendly_name: "citedby-count",
        id: 4
    }];
    $scope.available_categories = [{
        name: "dc:title",
        friendly_name: "title"
    }, {
        name: "prism:publicationName",
        friendly_name: "Publication Name"
    }, {
        name: "prism:coverDisplayDate",
        friendly_name: "coverDisplayDate"
    }, {
        name: "prism:issn",
        friendly_name: "issn"
    }, {
        name: "prism:aggregationType",
        friendly_name: "aggregationType"
    }, {
        name: "subtypeDescription",
        friendly_name: "subtypeDescription"
    }, {
        name: "citedby-count",
        friendly_name: "citedby-count"
    }];
	var categories_friendlynames = {
		"dc:title": "title",
		"prism:publicationName": "Publication Name"
	};
    $scope.data = [];
	$scope.currentsortby = -1;
	
    function updateResults() {
        $scope.data = [];
        for (var id in $scope.auid_list)
            $scope.data = $scope.data.concat($scope.auid_list[id].data);
        console.log($scope.data);
		// Update list of available columns
		var avcat = {};
		for (var i in $scope.data) {
			for (var j in $scope.data[i]) {
				if(categories_friendlynames[j] == null)
					avcat[j] = j;
				else
					avcat[j] = categories_friendlynames[j];
			}
		}
		var avcatarr = [];
		for (var i in avcat) {
			avcatarr.push({name: i, friendly_name: avcat[i]});
		}
		$scope.available_categories = avcatarr;
		$scope.currentsortby = -1;
    }
	
	$scope.sortby = function(id) {
		// IMPLEMENT SORT
		$scope.currentsortby = id;
	}

    $scope.add = function() {
        $scope.auid_list_error = [];
        // Split the input by a comma, ignoring all white space characters
        var authors = $scope.auid_input.replace(/\s/g, "").split(',');
        if (authors.length == 0) return;
        for (var author in authors) {
            if (!isNaN(authors[author])) {
                console.log("Adding Scopus author: " + authors[author]);
                // If only numbers, we assume it is an Scopus Author ID
                if (!$scope.auid_list[authors[author]])
                    $scope.auid_list[authors[author]] = {
                        id: authors[author],
                        type: "Scopus",
                        data: null
                    };
            }
            else {
                // Match by ORCIDs
                var match = authors[author].match(/[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}/);
                if (match && match.length == 1) {
                    console.log("Adding ORCID author:" + authors[author]);
                    if (!$scope.auid_list[authors[author]])
                        $scope.auid_list[authors[author]] = {
                            id: authors[author],
                            type: "ORCID",
                            data: null
                        };
                }
                else {
                    console.log("Unknown author:" + authors[author]);
                    // When no matches were found
                    $scope.auid_list_error.push(authors[author]);
                }
            }
        }
        if ($scope.auid_list_error.length > 0) $('#modal-inerr').modal('open');
        updateNewlyAdded();
    };

    $scope.addCategory = function(av) {
        $scope.categories.push({
            name: av.name,
            friendly_name: av.friendly_name,
            id: $scope.categories.length
        });
    };

    $scope.delete = function(auid) {
        console.log("Deleting author: " + auid);
        delete $scope.auid_list[auid];
        updateResults();
    };

    function updateOne(id, startIndex) {
        console.log("Loading data for author: " + id + ", startIndex: " + startIndex);
        $http
            .get(BASE_URL + "/content/search/scopus", {
                params: {
                    apikey: apikey,
                    query: "au-id(" + id + ")",
                    start: startIndex
                }
            })
            .then(function(response) {
                console.log(response.data["search-results"].entry);
                if (!$scope.auid_list[id].data || $scope.auid_list[id].data.length == 0)
                    $scope.auid_list[id].data = response.data["search-results"].entry;
                else
                    $scope.auid_list[id].data = $scope.auid_list[id].data.concat(response.data["search-results"].entry);

                if (startIndex + response.data["search-results"]["opensearch:itemsPerPage"] < response.data["search-results"]["opensearch:totalResults"]) {
                    updateOne(id, startIndex + Number(response.data["search-results"]["opensearch:itemsPerPage"]));
                }
                else {
                    $scope.loading--;
                    updateResults();
                }
            }, function(response) {
                $scope.log = JSON.stringify(response.data, null, 2);
                console.log("Error: ");
                console.log(response);
                $scope.loading--;
                updateResults();
            });
    }

    function updateNewlyAdded() {
        for (var id in $scope.auid_list) {
            if (!$scope.auid_list[id].data) {
                $scope.loading++;
                if ($scope.auid_list[id].type === "ORCID") {
                    // TODO Get Scopus Author ID first!
                    console.log("ORCID TO SCOPUS AUTHOR ID CONVERSION NOT IMPLEMENTED YET!");
                    setTimeout(updateOne(id, 0), 0);
                }
                else
                    setTimeout(updateOne(id, 0), 0);
            }
        }
    }

    $(document).ready(function() {
        $('.modal').modal();
    });
}]);
