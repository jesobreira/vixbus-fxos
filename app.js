$(function() {
	$( document ).on( "pagebeforechange" , function(e, data) {
	  var toPage = data.toPage[0].id;
	  if(toPage == "home") {
	    reload_favs();
	  }
	});
	
	$('#linhas').on('click','a', function(){
		load_linha($(this).attr('rel'));
    });

    $('#fav').on('click','a', function(){
		load_linha($(this).attr('rel'));
    });

	function load_linha(rel) {
	    // clean
		$(".horarios").empty('');

        // var rel = parseInt(rel); // strangely this caused a bug on fxos 1.1, which reduced 200 from the bus ID o.O
		$.htche("jamacedo.com/meudestino/consulta.php?op=linha&cod="+rel, function(data) {
			$('.linha_cod').text(rel);
			$(".p1_nome").text(data.p1_nome);
			$(".p2_nome").text(data.p2_nome);

			var listas = { // class: json_prop
				duteis: "uteis",
				dsab: "sabados",
				ddom: "domingos",
				datip: "atipicos"
			};
			
			// horários
			var keys = Object.keys(listas);
			for (var j = 0; j < keys.length; j++) {
				var key = keys[j];
			    var val = listas[keys[j]];
			    
			    for(i = 1; i<=2; i++) {
					$("#"+key+" .p"+i).append('<li><b>Saída:<br/>'+(data['p'+i+'_nome'])+'</b></li>');
					data['p'+i+'_horarios_'+val].forEach(function(horario) {
						if(isNaN(horario.substr(-1, 1))) {
							var letra = horario.substr(-1, 1);
							var attr;
							if(typeof data.observacoes[letra] != 'undefined') {
								attr = ' onClick="showmodal(\'' + addslashes(data.observacoes[letra]) + '\');" ';
							}
						}
						$('#'+key+' .p'+i).append('<li '+ attr +'>'+horario+'</li>');
					});
				}
			}

			// itinerários
			$("#p1_itinerario").html(data.p1_itinerario.toString().split(",").join("<br/>"));
			$("#p2_itinerario").html(data.p2_itinerario.toString().split(",").join("<br/>"));

			// favoritos?
			$("#favlabel").attr("rel", rel);
			if(is_fav(rel)) {
				$("#favlabel").text("Rem. favoritos");
			} else {
				$("#favlabel").text("Ad. favoritos");
			}

			if($('.horarios').listview() != 'undefined') $(".horarios").listview('refresh');
			$.mobile.changePage('#verlinha');
		});
	}
	reload_favs();
	reload_todas();

	$("#favlabel").click(function() {
		var rel = $(this).attr('rel');
		togglefav(rel);
		if(is_fav(rel)) {
			$("#favlabel").text("Rem. favoritos");
		} else {
			$("#favlabel").text("Ad. favoritos");
		}
	});
	
	
	$("#reloadtodas").click(function() {
		reload_todas();
	});
	
	$( document ).on( "swipeleft swiperight", "#verlinha", function( e ) {
		// We check if there is no open panel on the page because otherwise
		// a swipe to close the left panel would also open the right panel (and v.v.).
		// We do this by checking the data that the framework stores on the page element (panel: open).
		if ( $( ".ui-page-active" ).jqmData( "panel" ) !== "open" ) {
			if ( e.type === "swipeleft" ) {
				$( "#right-panel" ).panel( "open" );
			} else if ( e.type === "swiperight" ) {
				$( "#left-panel" ).panel( "open" );
			}
		}
	});

	$(".datacall").click(function() {
		var rel = $(this).attr('rel');
		$(".dataview").fadeOut(100);
		$("#"+rel).delay(150).fadeIn();
		$( "#left-panel" ).panel( "close" );
		$( "#right-panel" ).panel( "close" );
	});
		
	// funcs
	function togglefav(id) {
		var favorites = store.get('favs');
		if(typeof favorites == 'undefined') {
			store.set('favs', []);
			favorites = store.get('favs');
		}

		if(!in_array(id, favorites)) {
			favorites.push(id);
			store.set('favs', favorites);
			toast("Adicionado aos favoritos!");
		} else {
			var index = favorites.indexOf(id);
			favorites.splice(index, 1);
			store.set('favs', favorites);
			toast("Removido dos favoritos!");
		}
	}

	function is_fav(id) {
		var favorites;
		favorites = store.get('favs');
		if(typeof favorites == 'undefined') {
			store.set('favs', []);
			favorites = store.get('favs');
		}
		return in_array(id, favorites);
	}

	function reload_favs() {
		var favorites;
		$("#fav").empty();
		favorites = store.get('favs');
		if(typeof favorites == 'undefined') {
			store.set('favs', []);
			favorites = store.get('favs');
		}
		if(favorites.length) {
			favorites.forEach(function(id) {
				$('#fav').append("<a data-inline='true' data-role='button' href='#' class='favlink' rel='"+id+"'>"+id+"</a>");
			});
			$("#fav").trigger("create"); // due to jqm bug, button('refresh') does not work 
		} else {
			$("#nofav").slideDown();
		}
	}
	
	function reload_todas(update) {
		if(typeof update == 'undefined') update = false;
		$.htche("jamacedo.com/meudestino/consulta.php?op=linhas", function(data) {
			var j = data.length-1;
			$("#linhas li").remove();
			for(i = 0; i<=j; i++) {
				var pic = (parseInt(data[i].cod)>=1000) ? 'seletivo' : 'transcol';
				
				$("#linhas").append('<li rel="'+data[i].cod+'">\
										<a rel="'+data[i].cod+'">\
										<h3>'+data[i].cod+'</h3>\
										<p>'+data[i].p1_nome+' &middot; '+data[i].p2_nome+'</p>\
										<img src="img/'+pic+'.png" align="right" />\
										</a>\
									</li>');
			}
			$("#linhas").listview('refresh');
		}, update);
	}
});

function initMap() {
	  var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 13,
		center: {lat: -20.3222, lng: -40.3381}
	  });

	  var trafficLayer = new google.maps.TrafficLayer();
	  trafficLayer.setMap(map);
	  
	  
	  var transitLayer = new google.maps.TransitLayer();
	  transitLayer.setMap(map);

	if (navigator.geolocation) {
     navigator.geolocation.getCurrentPosition(function (position) {
         initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
         map.setCenter(initialLocation);
     });
	}
}

function addslashes(str) {
  //  from: http://phpjs.org/functions/addslashes/

  return (str + '')
    .replace(/[\\"']/g, '\\$&')
    .replace(/\u0000/g, '\\0');
}


function showmodal(str) {
	$('<div>').simpledialog2({
    	mode: 'blank',
    	headerText: 'Vixbus',
    	dialogForce: true,
    	headerClose: true,
    	blankContent : "<p>"+str+"</p>"+
      // NOTE: the use of rel="close" causes this button to close the dialog.
      "<a rel='close' data-role='button' href='#'>Fechar</a>"
 	});
}

function in_array(needle, haystack) {
    var length = haystack.length;
    for(var i = 0; i < length; i++) {
        if(haystack[i] == needle) return true;
    }
    return false;
}