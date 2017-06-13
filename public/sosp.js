/* global $ */
/* global angular */
var app = angular.module("SOSP", []);
console.log("App initialized");
app.controller("MainCtrl", ["$scope", "$http", function($scope, $http) {
    console.log("Controller initialized");
    var BASE_URL = "https://api.elsevier.com";
    //BASE_URL = "../output.json?";
    $scope.auid_input = "0000-0001-9827-1834,0000-0002-0303-2740,6701473617,0000-0002-8763-0819,0000-0003-2271-2765,25629936300,0000-0002-4708-4606,0000-0001-8992-3466,8961082000,56235607600,9247521200,7006826705,55728096900,0000-0002-1314-9694,0000-0001-9581-2711,23985742000,0000-0002-1320-2424,7401886758";
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
    $scope.currentsortdirrev = false;

    function updateResults() {
        $scope.data = [];
        for (var id in $scope.auid_list)
            $scope.data = $scope.data.concat($scope.auid_list[id].data);
        //console.log($scope.data);
        // Update list of available columns
        var avcat = {};
        for (var i in $scope.data) {
            for (var j in $scope.data[i]) {
                if (categories_friendlynames[j] == null)
                    avcat[j] = j;
                else
                    avcat[j] = categories_friendlynames[j];
            }
        }
        var avcatarr = [];
        for (var i in avcat) {
            avcatarr.push({
                name: i,
                friendly_name: avcat[i]
            });
        }
        $scope.available_categories = avcatarr;
        $scope.currentsortby = -1;
    }

    $scope.sortby = function(id) {
        $scope.loading++;
        if ($scope.currentsortby == id) {
            $scope.currentsortdirrev = !$scope.currentsortdirrev;
            $scope.data.reverse();
        }
        else {
            $scope.currentsortby = id;
            $scope.currentsortdirrev = false;
            $scope.data.sort(function(a, b) {
                if ((!a[$scope.categories[$scope.currentsortby].name] && !b[$scope.categories[$scope.currentsortby].name]) || (typeof a[$scope.categories[$scope.currentsortby].name] === 'object' || typeof b[$scope.categories[$scope.currentsortby].name] === 'object'))
                    return 0;
                if (!a[$scope.categories[$scope.currentsortby].name])
                    return 1;
                if (!b[$scope.categories[$scope.currentsortby].name])
                    return -1;
                if (!isNaN(a[$scope.categories[$scope.currentsortby].name]) && !isNaN(b[$scope.categories[$scope.currentsortby].name]))
                    return b[$scope.categories[$scope.currentsortby].name] - a[$scope.categories[$scope.currentsortby].name];
                else
                    return a[$scope.categories[$scope.currentsortby].name].localeCompare(b[$scope.categories[$scope.currentsortby].name]);
            });
        }
        $scope.loading--;
    };

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
                        scopusaid: authors[author],
                        type: "Scopus",
                        name: "Retrieving...",
                        data: null,
                        loading_state: true,
                        publication_count: "Retrieving...",
                        author_loading: 100
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
                            scopusaid: "Retrieving...",
                            type: "ORCID",
                            name: "Retrieving...",
                            data: null,
                            loading_state: true,
                            publication_count: "Retrieving...",
                            author_loading: 100
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
        for (var id in $scope.auid_list) {
            setTimeout(updateNewlyAddedAuthor(id), 100);
        }
    };

    $scope.addCategory = function(av) {
        $scope.categories.push({
            name: av.name,
            friendly_name: av.friendly_name,
            id: $scope.categories.length
        });
        for (var i in $scope.categories)
            $scope.categories[i].id = i;
    };

    $scope.removeCategory = function() {
        $scope.currentsortby = -1;
        $scope.currentsortdirrev = false;
    };

    $scope.delete = function(auid) {
        console.log("Deleting author: " + auid);
        delete $scope.auid_list[auid];
        updateResults();
    };

    function updateOne(id, auid, startIndex) {
        var doccount = 100;
        console.log("Loading data for author: " + id + ", startIndex: " + startIndex);
        $http
            .get(BASE_URL + "/content/search/scopus", {
                params: {
                    apikey: apikey,
                    query: "au-id(" + auid + ")",
                    start: startIndex,
                    count: doccount
                }
            })
            .then(function(response) {
                console.log(response.data);
                //console.log(response.data["search-results"].entry);
                if (!$scope.auid_list[id].data || $scope.auid_list[id].data.length == 0)
                    $scope.auid_list[id].data = response.data["search-results"].entry;
                else
                    $scope.auid_list[id].data = $scope.auid_list[id].data.concat(response.data["search-results"].entry);

                if (startIndex + Number(response.data["search-results"]["opensearch:itemsPerPage"]) < Number(response.data["search-results"]["opensearch:totalResults"])) {
                    //console.log("Updating one more...");
                    updateOne(id, auid, startIndex + Number(response.data["search-results"]["opensearch:itemsPerPage"]));
                    $scope.auid_list[id].publication_count = Number(startIndex + doccount) + "/" + response.data["search-results"]["opensearch:totalResults"];
                    $scope.auid_list[id].author_loading = ((Number(startIndex) + doccount) / Number(response.data["search-results"]["opensearch:totalResults"])) * 100;
                }
                else {
                    //console.log("Done updating " + startIndex + " " + response.data["search-results"]["opensearch:itemsPerPage"] + " " + response.data["search-results"]["opensearch:totalResults"]);
                    $scope.loading--;
                    $scope.auid_list[id].loading_state = false;
                    for (var i in $scope.auid_list[id].data) {
                        $scope.auid_list[id].data[i]["ScopusAuthorID"] = auid;
                        $scope.auid_list[id].data[i]["ScopusAuthorName"] = $scope.auid_list[id].name;
                    }
                    $scope.auid_list[id].publication_count = response.data["search-results"]["opensearch:totalResults"];
                    updateResults();
                }
            }, function(response) {
                $scope.log = JSON.stringify(response.data, null, 2);
                console.log("Error: ");
                console.log(response);
                $scope.loading--;
                $scope.auid_list[id].loading_state = false;
                updateResults();
            });
    }

    function updateNewlyAddedAuthor(id) {
        console.log("Working with " + id);
        if (!$scope.auid_list[id].data) {
            $scope.loading += 2;
            if ($scope.auid_list[id].type === "ORCID") {

                console.log("Getting Scopus Author ID and name for " + id);
                $http
                    .get(BASE_URL + "/content/search/author", {
                        params: {
                            apikey: apikey,
                            query: "orcid(" + id + ")",
                            count: 200
                        }
                    })
                    .then(function(response) {
                        $scope.auid_list[id].name = response.data["search-results"].entry[0]["preferred-name"]["given-name"] + " " + response.data["search-results"].entry[0]["preferred-name"]["surname"];
                        $scope.auid_list[id].scopusaid = Number(response.data["search-results"].entry[0]["dc:identifier"].replace("AUTHOR_ID:", ""));
                        console.log("Retrieved name for id " + id);
                        setTimeout(updateOne(id, $scope.auid_list[id].scopusaid, 0), 0);
                        $scope.loading--;
                    }, function(response) {
                        console.log("Error: ");
                        console.log(response);
                        $scope.loading--;
                    });

            }
            else {

                console.log("Getting name for " + id);
                $http
                    .get(BASE_URL + "/content/search/author", {
                        params: {
                            apikey: apikey,
                            query: "au-id(" + id + ")",
                            count: 200
                        }
                    })
                    .then(function(response) {
                        $scope.auid_list[id].name = response.data["search-results"].entry[0]["preferred-name"]["given-name"] + " " + response.data["search-results"].entry[0]["preferred-name"]["surname"];
                        console.log("Retrieved name for id " + id);
                        $scope.loading--;
                    }, function(response) {
                        console.log("Error: ");
                        console.log(response);
                        $scope.loading--;
                    });
                setTimeout(updateOne(id, id, 0), 0);

            }
        }
    }

    $(document).ready(function() {
        $('.modal').modal();
    });
}]);
