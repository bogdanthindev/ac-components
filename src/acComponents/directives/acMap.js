angular.module('acComponents.directives')
    .directive('acMapboxMap', function ($rootScope, $log, $window, $timeout, acBreakpoint, MAPBOX_ACCESS_TOKEN, MAPBOX_MAP_ID, AC_API_ROOT_URL) {
        return {
            template: '<div id="map"></div>',
            replace: true,
            scope: {
                mapboxAccessToken: '@',
                mapboxMapId: '@',
                sidebar: '@acMapSidebar',
                region: '=acRegion',
                regions: '=acRegions',
                obs: '=',
                filters: '='
            },
            link: function ($scope, el, attrs) {
                $scope.device = {};
                var layers = {
                    dangerIcons: L.featureGroup()
                };
                var styles = {
                    region: {
                        default: {
                            fillColor: 'transparent',
                            color: 'transparent'
                        },
                        selected: {
                            fillColor: '#489BDF'
                        }
                    }
                };

                L.mapbox.accessToken = MAPBOX_ACCESS_TOKEN;
                var map = L.mapbox.map(el[0].id, MAPBOX_MAP_ID, {attributionControl: false});
                map.setView([52.3, -120.74966],6);

                /*var provinces = L.mapbox.geocoder('mapbox.places-province-v1');
                provinces.query('British-Columbia', function (err, results) {
                    var bcBounds = L.latLngBounds([results.bounds[1], results.bounds[0]], [results.bounds[3], results.bounds[2]]);
                    map.fitBounds(bcBounds);
                });*/

                L.control.locate({
                    locateOptions: {
                        maxZoom: 14
                    }
                }).addTo(map);

                acBreakpoint.setBreakpoints({
                    xs: 480,
                    sm: 600,
                    md: 1025,
                });

                $rootScope.$on('breakpoint', function (e, breakpoint) {
                    $scope.device.size = breakpoint;
                });

                function getInvalidateSize(topOffset) {
                    return function () {
                        el.height($($window).height()-Number(topOffset));
                        map.invalidateSize();
                    }
                }

                if(attrs.topOffset) {
                    var offset = Number(attrs.topOffset);
                    var invalidateSize = getInvalidateSize(offset);
                    
                    angular.element(document).ready(invalidateSize);
                    angular.element($window).bind('resize', invalidateSize);
                }

                function refreshObsLayer() {
                    if (map.hasLayer(layers.obs)){
                        map.removeLayer(layers.obs);
                    }

                    if($scope.obs.length > 0 ) {
                        var markers = $scope.obs.map(function (ob) {
                            return L.marker(ob.latlng, {
                                icon: L.mapbox.marker.icon({
                                    'marker-size': 'large',
                                    'marker-symbol': 'beer',
                                    'marker-color': '#09c'
                                })
                            }).bindPopup('<a href="/share/' + ob.obid + '">' + ob.obid + '</a>');
                        });

                        layers.obs = L.featureGroup(markers).addTo(map);
                    }
                }

                function latLngToGeoJSON(latlng){
                    return {
                        type: 'Point',
                        coordinates: [latlng.lng, latlng.lat]
                    };
                }

                function getMapPadding(){
                    switch($scope.device.size) {
                        case 'xs':
                            return L.point([0, 0]);
                        case 'sm':
                            return L.point([350, 0]);
                        case 'md':
                        case 'lg':
                            return L.point([480, 0]);
                        default:
                            return L.point([0,0]);
                    }
                }

                function getMapOffset(){
                    return getMapPadding().divideBy(2);
                }

                // offfset can be negative i.e. [-240, 0]
                function offsetLatLng(latlng, offset){
                    var point = map.latLngToLayerPoint(latlng);
                    return map.layerPointToLatLng(point.subtract(offset));
                }

                function getMapCenter(){
                    var offset = getMapOffset();
                    return offsetLatLng(map.getCenter(), offset);
                }

                function getMapBounds() {
                    var latLngBounds = map.getBounds();
                    var min = map.latLngToLayerPoint(latLngBounds.getNorthWest());
                    var max = map.latLngToLayerPoint(latLngBounds.getSouthEast());
                    var padding = getMapPadding();

                    var bounds = L.bounds(min, max.subtract(padding));
                    var nw = map.layerPointToLatLng(bounds.max);
                    var se = map.layerPointToLatLng(bounds.min);

                    return L.latLngBounds(nw, se);
                }

                function getMapCenterBuffer(){
                    var mapCenter = getMapCenter();
                    var centerPoint = map.latLngToLayerPoint(mapCenter);
                    var buffer = L.bounds([centerPoint.x-50, centerPoint.y-50], [centerPoint.x+50, centerPoint.y+50]);

                    var nw = map.layerPointToLatLng(buffer.max);
                    var se = map.layerPointToLatLng(buffer.min);

                    return  L.latLngBounds(nw, se);
                }

                function setRegionFocus() {
                    if(map.getZoom() >= 8) {
                        var region;
                        var centerBuffer = getMapCenterBuffer();
                        var regions = layers.regions.getLayers();
                        var mapCenter = getMapCenter();
                        var mapBounds = getMapBounds();

                        var intersectsCenterBuffer = _.filter(regions, function (r) {
                            return centerBuffer.intersects(r.getBounds());
                        });

                        var withinMapBounds = _.filter(regions, function (r) {
                            return mapBounds.contains(r.getBounds());
                        });

                        var containsMapCenter = _.find(regions, function (r) {
                            return gju.pointInPolygon(latLngToGeoJSON(mapCenter), r.feature.geometry);
                        });

                        var centroidInMapBounds = _.filter(regions, function (r) {
                            return mapBounds.contains(r.feature.properties.centroid);
                        });

                        var intersectsCenterBufferAnWithinMapBounds = _.intersection(intersectsCenterBuffer, withinMapBounds);

                        if(intersectsCenterBufferAnWithinMapBounds.length === 1){
                            region = intersectsCenterBufferAnWithinMapBounds[0];
                        } else if(intersectsCenterBufferAnWithinMapBounds.length > 1) {
                            region = _.min(intersectsCenterBufferAnWithinMapBounds, function (r) {
                                return r.feature.properties.centroid.distanceTo(mapCenter);
                            });
                        } else if(centroidInMapBounds.length === 1){
                            region = centroidInMapBounds[0];
                        } else if(centroidInMapBounds.length > 1){
                            region = _.min(centroidInMapBounds, function (r) {
                                return r.feature.properties.centroid.distanceTo(mapCenter);
                            });
                        } else if (containsMapCenter) {
                            region = containsMapCenter;
                        }

                        $scope.$apply(function () {
                            $scope.region = region;
                        });
                    }
                }


                function refreshRegionsLayer(){
                    var zoom = map.getZoom();
                    var regionsVisible = map.hasLayer(layers.regions);

                    if(zoom < 6 && regionsVisible) {
                        map.removeLayer(layers.regions);
                    } else if (zoom >= 6 && !regionsVisible) {
                        map.addLayer(layers.regions);
                    } else if (zoom > 10 && regionsVisible) {
                        map.removeLayer(layers.regions);
                    }
                }

                map.on('dragend', setRegionFocus);

                map.on('moveend', function () {
                    if(layers.dangerIcons) {
                        if(map.getZoom() <= 6 && map.hasLayer(layers.dangerIcons)) {
                            map.removeLayer(layers.dangerIcons);
                        } else if (map.getZoom() > 6 && !map.hasLayer(layers.dangerIcons)){
                            map.addLayer(layers.dangerIcons);
                        }
                    }
                });

                map.on('zoomend', function () {
                    var mapZoom = map.getZoom();
                    var opacity = 0.2;

                    if(layers.currentRegion) {
                        if(mapZoom <= 9) {
                            styles.region.selected.fillOpacity = opacity;
                            layers.currentRegion.setStyle(styles.region.selected);
                        } else if(mapZoom > 9 && mapZoom < 13){
                            switch(mapZoom){
                                case 10:
                                    opacity = 0.15;
                                    break;
                                case 11:
                                    opacity = 0.10;
                                    break;
                                case 12:
                                    opacity = 0.05;
                                    break;
                            }

                            styles.region.selected.fillOpacity = opacity;
                            layers.currentRegion.setStyle(styles.region.selected);
                        } else {
                            layers.currentRegion.setStyle(styles.region.default);
                        }
                    }

                    refreshRegionsLayer();

                });

                $scope.$watch('region', function (region) {

                    if(region && layers.regions) {
                        layers.regions.eachLayer(function (layer) {
                            if(layer === region){
                                layer.setStyle(styles.region.selected);
                                layers.currentRegion = layer;
                            } else {
                                layer.setStyle(styles.region.default)
                            }
                        });
                    }
                });

                $scope.$watch('regions', function (regions) {
                    if(regions && regions.features) {

                        layers.regions = L.geoJson($scope.regions, {
                            style: function(feature) {
                                return styles.region.default;
                            },
                            onEachFeature: function (featureData, layer) {
                                layer.bindLabel(featureData.properties.name, {noHide: true});

                                function showRegion(evt){
                                    if(map.getZoom() < 9) {
                                        var padding = getMapPadding();

                                        map.fitBounds(layer.getBounds(), {
                                            paddingBottomRight: padding
                                        });
                                    } else {
                                        map.panTo(evt.latlng);
                                    }

                                    $scope.$apply(function () {
                                        $scope.region = layer;
                                    });
                                }

                                layer.on('click', showRegion);

                                if(featureData.properties.centroid) {
                                    var centroid = L.latLng(featureData.properties.centroid[1], featureData.properties.centroid[0]);

                                    L.marker(centroid, {
                                        icon: L.icon({
                                            iconUrl: AC_API_ROOT_URL+featureData.properties.dangerIconUrl,
                                            iconSize: [80, 80]
                                        })
                                    }).on('click', showRegion).addTo(layers.dangerIcons);
                                }

                            }
                        });

                        refreshRegionsLayer();
                    }
                });

                $scope.$watch('obs', function (obs) {
                    if(obs) {
                        refreshObsLayer();
                    }
                });

            }
        };
    });
