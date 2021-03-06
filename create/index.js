var dust = require('dust')();
var form = require('form');
var utils = require('utils');
var serand = require('serand');

var Location = require('../service');

dust.loadSource(dust.compile(require('./template.html'), 'model-locations-create'));

var LOCATIONS_API = utils.resolve('apis:///v/locations');

var googleGelocate = 'https://www.googleapis.com/geolocation/v1/geolocate?key=';

utils.configs('boot', function (err, config) {
    if (err) {
        return console.error(err)
    }
    googleGelocate += config.googleKey;
});

var configs = {
    name: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done()
        }
    },
    line1: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please enter the number, street etc. of your location.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done()
        }
    },
    line2: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done()
        }
    },
    city: {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please enter the city of your location.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            serand.blocks('select', 'update', source, {
                value: value
            }, done);
        },
        render: function (ctx, lform, data, value, done) {
            var el = $('.city', lform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function () {
                    var city = Location.cityByName($(this).val());
                    var postal = city && city.postal;
                    var source = $('.postal', lform.elem);
                    serand.blocks('select', 'find', source, function (err, value) {
                        if (err) {
                            return console.error(err);
                        }
                        if (value === postal) {
                            return;
                        }
                        serand.blocks('select', 'update', source, {
                            value: postal
                        }, function (err) {
                            if (err) {
                                return console.error(err);
                            }
                        });
                    });
                }
            }, done);
        }
    },
    postal: {
        find: function (context, source, done) {
            serand.blocks('select', 'find', source, done);
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please enter the postal code of your location.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            serand.blocks('select', 'update', source, {
                value: value
            }, done);
        },
        render: function (ctx, lform, data, value, done) {
            var el = $('.postal', lform.elem);
            serand.blocks('select', 'create', el, {
                value: value,
                change: function () {
                    var city = Location.cityByPostal($(this).val());
                    var name = city && city.name;
                    var source = $('.city', lform.elem);
                    serand.blocks('select', 'find', source, function (err, value) {
                        if (err) {
                            return console.error(err);
                        }
                        if (value === name) {
                            return;
                        }
                        serand.blocks('select', 'update', source, {
                            value: name
                        }, function (err) {
                            if (err) {
                                return console.error(err);
                            }
                        });
                    });
                }
            }, done);
        }
    },
    district: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please enter the district of your location.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            if (!value) {
                return done();
            }
            $('input', source).val(value).change();
            source.removeClass('hidden');
            done()
        },
        render: function (ctx, lform, data, value, done) {
            var el = $('.district', lform.elem);
            if (value) {
                el.removeClass('hidden');
            } else {
                el.addClass('hidden');
            }
            serand.blocks('text', 'create', el, {
                value: value,
                change: function () {
                    var thiz = $(this);
                    var district = thiz.val();
                    var cities = [];
                    var postals = [];
                    var citiesByDistrict = Location.citiesByDistrict(district);
                    citiesByDistrict.forEach(function (city) {
                        cities.push({
                            value: city.name,
                            label: [city.name].concat(city.aliases || []).join(' | ')
                        });
                        postals.push({
                            value: city.postal,
                            label: city.postal
                        });
                    });
                    cities = _.sortBy(cities, 'value');
                    var cityEl = $('.city', lform.elem);
                    var postalEl = $('.postal', lform.elem);
                    serand.blocks('select', 'find', cityEl, function (err, value) {
                        if (err) {
                            return console.error(err);
                        }
                        serand.blocks('select', 'update', cityEl, {
                            options: cities,
                            value: value
                        }, function (err) {
                            if (err) {
                                return console.error(err);
                            }
                        });
                    });
                    postals = _.sortBy(postals, 'value');
                    serand.blocks('select', 'find', postalEl, function (err, value) {
                        if (err) {
                            return console.error(err);
                        }
                        serand.blocks('select', 'update', postalEl, {
                            options: postals,
                            value: value
                        }, function (err) {
                            if (err) {
                                return console.error(err);
                            }
                        });
                    });
                }
            }, done);
        }
    },
    province: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please enter the province of your location.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            if (!value) {
                return done();
            }
            $('input', source).val(value);
            source.removeClass('hidden');
            done()
        },
        render: function (ctx, lform, data, value, done) {
            var el = $('.province', lform.elem);
            if (value) {
                el.removeClass('hidden').find('input').val(location.province);
            } else {
                el.addClass('hidden');
            }
            done()
        }
    },
    state: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            if (!value) {
                return done();
            }
            $('input', source).val(value);
            source.removeClass('hidden');
            done()
        },
        render: function (ctx, lform, data, value, done) {
            var el = $('.state', lform.elem);
            if (value) {
                el.removeClass('hidden').find('input').val(location.state);
            } else {
                el.addClass('hidden');
            }
            done()
        }
    },
    country: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please select the country of your location.');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done();
        }
    },
    latitude: {
        find: function (context, source, done) {
            done(null, context.value);
        },
        validate: function (context, data, value, done) {
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            context.value = value;
            done();
        },
        render: function (ctx, lform, data, value, done) {
            done(null, {value: value});
        }
    },
    longitude: {
        find: function (context, source, done) {
            done(null, context.value);
        },
        validate: function (context, data, value, done) {
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            context.value = value;
            done();
        },
        render: function (ctx, lform, data, value, done) {
            done(null, {value: value});
        }
    },
    visibility: {
        find: function (context, source, done) {
            serand.blocks('checkboxes', 'find', source, function (err, value) {
                done(err, value);
            });
        },
        render: function (ctx, vform, data, value, done) {
            var el = $('.visibility', vform.elem);
            var visibility = data._ && data._.visibility && data._.visibility.published ? ['restricted'] : [];
            serand.blocks('checkboxes', 'create', el, {
                value: visibility
            }, done);
        }
    },
    _: {
        validate: function (data, done) {
            var _;
            var visibles;
            var visibility;
            var groups = utils.groups();
            var o = data.visibility;
            delete data.visibility;
            _ = data._ || (data._ = {});
            visibility = _.visibility || (_.visibility = {});
            if (o.indexOf('restricted') !== -1) {
                visibles = {};
                visibles[groups.anonymous.id] = ['postal', 'city', 'district', 'province', 'state', 'country'];
                visibles[groups.public.id] = ['postal', 'city', 'district', 'province', 'state', 'country'];
                visibility.published = visibles;
            } else {
                delete visibility.published;
            }
            done(null, null, data);
        }
    }
};

var create = function (locationsForm, location, done) {
    locationsForm.find(function (err, data) {
        if (err) {
            return done(err);
        }
        locationsForm.validate(data, function (err, errors, data) {
            if (err) {
                return done(err);
            }
            locationsForm.update(errors, data, function (err) {
                if (err) {
                    return done(err);
                }
                if (errors) {
                    return done(null, errors);
                }
                if (location) {
                    data.id = location.id;
                }
                utils.create('locations', Location.create, location, data, function () {
                    return true
                }, function (err, location) {
                    if (err) {
                        return done(err);
                    }
                    done(null, null, location);
                });
            });
        });
    });
};

var formats = {
    'LK': function (o) {
        move(o, 'state', 'province');
        if (!o.line1 && o.line2) {
            move(o, 'line2', 'line1');
        }
        if (o.province) {
            o.province = o.province.replace(/\sProvince$/, '');
        }
        return o;
    }
};

var move = function (o, from, to) {
    o[to] = o[from];
    o[from] = null;
    return o;
};

var locateIp = function (done) {
    $.ajax({
        url: googleGelocate,
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            considerIp: 'true'
        }),
        success: function (data) {
            done(null, {
                latitude: data.location.lat,
                longitude: data.location.lng
            });
        },
        error: function (xhr, status, err) {
            done(err || status || xhr);
        }
    });
};

var locationUpdated = function (ctx, elem, location) {
    console.log(location);
    location = location || {};
    ctx.current = location;
    ctx.form.refresh(location, function (err) {
        if (err) {
            return console.error(err);
        }
    });
};

var normalize = function (o) {
    var address = {};
    var components = o.address_components;
    components.forEach(function (component) {
        component.types.forEach(function (type) {
            if (['political'].indexOf(type) !== -1) {
                return;
            }
            address[type] = component;
        });
    });
    var geometry = o.geometry;
    if (geometry) {
        address.latitude = geometry.location.lat;
        if (typeof address.latitude === 'function') {
            address.latitude = address.latitude();
        }
        address.longitude = geometry.location.lng;
        if (typeof address.longitude === 'function') {
            address.longitude = address.longitude();
        }
    }
    console.log('normalize')
    console.log(address)
    address.name = o.name;
    address.place_id = o.place_id;
    address.international_phone_number = o.international_phone_number;
    return address;
};

var locate = function (o) {
    o = normalize(o);
    var line1 = function (o) {
        if (o.premise) {
            return o.premise.long_name;
        }
        if (o.subpremise) {
            return o.subpremise.long_name;
        }
        if (o.room) {
            return o.room.long_name;
        }
        if (o.floor) {
            return o.floor.long_name;
        }
        if (o.post_box) {
            return o.post_box.long_name;
        }
        if (o.colloquial_area) {
            return o.colloquial_area.long_name;
        }
        if (o.street_number) {
            return o.street_number.long_name;
        }
        if (o.sublocality_level_2) {
            return o.sublocality_level_2.long_name;
        }
        /*if (o.sublocality_level_2) {
            line += line ? ', ' : '';
            line += o.sublocality_level_2.long_name;
        }*/
        return null;
    };
    var line2 = function (o) {
        var line = ''
        if (o.route) {
            line += o.route.long_name;
        }
        if (o.sublocality_level_1) {
            line += line ? ', ' : '';
            line += o.sublocality_level_1.long_name;
        }
        return line || null;
    };
    var city = Location.findCity(o.locality && o.locality.long_name, o.postal_code && o.postal_code.long_name);
    var location = {
        name: o.name,
        line1: line1(o),
        line2: line2(o),
        city: city && city.name,
        postal: city && city.postal,
        district: o.administrative_area_level_2 && o.administrative_area_level_2.long_name,
        state: o.administrative_area_level_1 && o.administrative_area_level_1.long_name,
        country: o.country && o.country.short_name,
        latitude: o.latitude,
        longitude: o.longitude
    };
    console.log('original');
    console.log(o);
    console.log('parsed');
    console.log(JSON.stringify(location));
    var format = formats[location.country];
    if (!format) {
        return location;
    }
    return format(location);
};

var getGeoCoder = function (ctx) {
    if (ctx.geocoder) {
        return ctx.geocoder;
    }
    ctx.geocoder = new google.maps.Geocoder();
    return ctx.geocoder;
}

var initMap = function (ctx, elem, options, done) {
    var map = new google.maps.Map($('.map', elem)[0], options);
    var marker = new google.maps.Marker({
        map: map,
        position: options.center,
        draggable: true
    });
    var autoComplete = new google.maps.places.Autocomplete($('.search', elem).find('input')[0], {});
    var places = new google.maps.places.PlacesService(map);

    map.addListener('click', function (e) {
        var latLng = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        };
        marker.setPosition(latLng);
        if (e.placeId) {
            places.getDetails({placeId: e.placeId}, function (place, status) {
                if (status !== 'OK') {
                    return console.error(status)
                }
                locationUpdated(ctx, elem, locate(place));
            });
            return;
        }
        findLocation(ctx, latLng, function (err, location) {
            if (err) {
                return console.error(err);
            }
            location.latitude = latLng.lat;
            location.longitude = latLng.lng;
            locationUpdated(ctx, elem, location);
        });
    });

    autoComplete.addListener('place_changed', function () {
        var place = utils.clone(autoComplete.getPlace());
        var location = locate(place);
        locationUpdated(ctx, elem, location);
        updateMap(ctx, elem, {
            zoom: 18, center: {
                lat: location.latitude,
                lng: location.longitude
            }
        }, serand.none);
    });

    ctx.map = map;
    ctx.marker = marker;
    ctx.autoComplete = autoComplete;
    ctx.places = places;
    done();
};

var findPosition = function (ctx, done) {
    if (ctx.location) {
        return done(null, ctx.location);
    }
    if (!navigator.geolocation) {
        console.log('no navigator location');
        return locateIp(done);
    }
    navigator.geolocation.getCurrentPosition(function (position) {
        console.log('navigator location options: %j', position);
        done(null, position.coords);
    }, function (err) {
        console.log('navigator location error: %j', err);
        locateIp(done);
    });
};

var findLocation = function (ctx, o, done) {
    if (ctx.location) {
        return done(null, ctx.location);
    }
    getGeoCoder(ctx).geocode({location: o}, function (results, status) {
        if (status !== 'OK') {
            return done(status);
        }
        done(null, locate(utils.clone(results[0])));
    });
};

var updateMap = function (ctx, elem, options, done) {
    ctx.map.setCenter(options.center);
    ctx.map.setZoom(options.zoom);
    ctx.marker.setPosition(options.center);
    done();
};

var showMap = function (ctx, elem, done) {
    findPosition(ctx, function (err, location) {
        if (err) {
            return done(err);
        }
        var center = {
            lat: location.latitude,
            lng: location.longitude
        };
        if (ctx.map) {
            return updateMap(ctx, elem, {zoom: 18, center: center}, done);
        }
        findLocation(ctx, center, function (err, location) {
            if (err) {
                return done(err);
            }
            var options = {
                zoom: 18,
                center: {
                    lat: location.latitude,
                    lng: location.longitude
                }
            };
            initMap(ctx, elem, options, function (err) {
                if (err) {
                    return done(err);
                }
                locationUpdated(ctx, elem, location);
                done();
            });
        });
    });
};

var render = function (ctx, container, options, location, done) {
    var sandbox = container.sandbox;
    var loc = serand.pack(_.cloneDeep(location || {}), container);
    var allCities = Location.allCities();
    var cities = [];
    allCities.forEach(function (city) {
        cities.push({
            value: city.name,
            label: [city.name].concat(city.aliases || []).join(' | ')
        });
    });
    cities = _.sortBy(cities, 'value');
    loc._.cities = cities;

    var postals = _.map(allCities, function (city) {
        return {
            value: city.postal,
            label: city.postal
        }
    });
    postals = _.sortBy(postals, 'value');
    loc._.postals = postals;
    loc._.visibility = [
        {label: 'Hidden', value: 'restricted'}
    ];

    dust.render('model-locations-create', serand.pack(loc, container, 'model-locations'), function (err, out) {
        if (err) {
            return done(err);
        }
        var elem = sandbox.append(out);
        var locationsForm = form.create(container.id, elem, configs);
        ctx.form = locationsForm;
        locationsForm.render(ctx, location, function (err) {
            if (err) {
                return done(err);
            }
            showMap({
                location: location,
                form: locationsForm
            }, elem, function (err) {
                if (err) {
                    return done(err);
                }
                if (container.parent) {
                    done(null, {
                        create: function (created) {
                            create(locationsForm, location, function (err, errors, data) {
                                if (err) {
                                    return created(err);
                                }
                                if (errors) {
                                    return created(null, errors);
                                }
                                created(null, null, data);
                            });
                        },
                        form: locationsForm,
                        clean: function () {
                            $('.model-locations-create', sandbox).remove();
                        }
                    });
                    return;
                }
                sandbox.on('click', '.create', function (e) {
                    utils.loading();
                    create(locationsForm, location, function (err, errors) {
                        utils.loaded();
                        if (err) {
                            return console.error(err);
                        }
                        if (errors) {
                            return;
                        }
                        serand.redirect(options.location || '/locations');
                    });
                });
                sandbox.on('click', '.cancel', function (e) {
                    serand.redirect(options.location || '/locations');
                });
                done(null, {
                    form: locationsForm,
                    clean: function () {
                        $('.model-locations-create', sandbox).remove();
                    }
                });
            });
        });
    });
};

module.exports = function (ctx, container, options, done) {
    options = options || {};
    var id = options.id;
    if (!id) {
        return render(ctx, container, options, null, done);
    }
    Location.findOne(options, function (err, location) {
        if (err) {
            return done(err);
        }
        render(ctx, container, options, location, done);
    });
};



