// ------------------------------------------------------------------------------
//
// FlightsWidgetAutocomplete
//
// ------------------------------------------------------------------------------

define([
  "jquery",
  "data/countries",
  "autocomplete"
], function($, countries, AutoComplete) {

  "use strict";

  var API_KEY = "lp994363056324023341132625613270",
      countryCode;

  function FlightsWidgetAutocomplete() {
    $.ajax({
      type: "GET",
      url: "http://www.lonelyplanet.com",
      success: function(data, textStatus, request) {
        var userCountry = $.grep(countries, function(currency) {
              return currency.Code === request.getResponseHeader("X-GeoIp-Countrycode");
            }),
            userCurrency, $currencySelect;

        if (userCountry.length && userCountry[0].Currency) {
          userCurrency = userCountry[0].Currency;
          $currencySelect = $(".js-currency-select");

          $currencySelect.find(".js-select").val(userCurrency);
          $currencySelect.find(".js-select-overlay").text(userCurrency);
        }
      }
    });
  }

  FlightsWidgetAutocomplete.prototype.init = function() {
    this.$fromAirport = $(".js-from-airport");
    this.$fromCity = $(".js-from-city");
    this.$toAirport = $(".js-to-airport");
    this.$toCity = $(".js-to-city");

    this.setupAutocomplete("#js-from-city");
    this.setupAutocomplete("#js-to-city");
  };

  FlightsWidgetAutocomplete.prototype.getCurrency = function(countries, countryCode) {
    var currency = "USD";
    for (var i = 0; i < countries.length; i++) {
      if (countries[i].Code === countryCode) {
        currency = countries[i].Currency;
      }
    }
    return currency;
  };

  FlightsWidgetAutocomplete.prototype.buildUrl = function() {
    var currency = this.getCurrency(countries, countryCode);
    return "http://partners.api.skyscanner.net/apiservices/xd/autosuggest/v1.0/" + countryCode + "/" + currency + "/";
  };

  FlightsWidgetAutocomplete.prototype.fetchCountries = function(searchTerm, callback) {
    var url = this.buildUrl();

    $.ajax({
      type: "GET",
      url: url + "en-GB?query=" + searchTerm + "&apikey=" + API_KEY,
      dataType: "JSONP"
    }).done(function(data) {
      var places = data.Places;

      places = places.filter(function(elem) {
        return elem.CityId !== "-sky";
      });
      for (var i = 0; i < places.length; i++) {
        var place = places[i];
        if (place.PlaceId === place.CityId) {
          place.PlaceName = place.PlaceName + " (Any)";
        } else {
          place.PlaceName = place.PlaceName + " (" + place.PlaceId.slice(0, -4) + ")";
        }
      }
      var city = "";
      for (i = 0; i < places.length; i++) {
        if (city === places[i].CityId) {
          places[i].isCity = "child";
        } else {
          city = places[i].CityId;
          places[i].isCity = "parent";

        }
      }
      callback(places);
    });
  };

  FlightsWidgetAutocomplete.prototype.onSelectCity = function(el) {
    var selectedCode = $(el).data("airport").slice(0, -4),
        selectedValue = $(el).text();

    selectedValue = selectedValue.substring(0, selectedValue.indexOf(")"));
    if (this.el === "#js-from-city") {
      this.$fromAirport.val(selectedCode);
      this.$fromCity.val(selectedValue + ")");
    } else {
      this.$toAirport.val(selectedCode);
      this.$toCity.val(selectedValue + ")");
    }
  };

  FlightsWidgetAutocomplete.prototype.setupAutocomplete = function(el) {
    new AutoComplete({
      el: el,
      threshold: 3,
      limit: 5,
      fetch: this.fetchCountries.bind(this),
      onItem: this.onSelectCity.bind(this),
      template: {
        elementWrapper:   "<div class='js-autocomplete'></div>",
        resultsWrapper:   "<div class='autocomplete'></div>",
        resultsContainer: "<ul class='autocomplete__results'></ul>",
        resultsItem:      "<li class='autocomplete__results__item' data-airport='{{PlaceId}}'><div class='{{isCity}}' id='results-irem-wrapper'><span id='autocomplete-place-name'>{{PlaceName}}</span><span id='autocomplete-country-name'>{{CountryName}}</span></div></li>",
      }
    });
  };

  return FlightsWidgetAutocomplete;

});
