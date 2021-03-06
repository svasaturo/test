/*global define */

/*jslint indent:2, unparam: true */

define(['jquery', 'cnr/cnr.node', 'cnr/cnr.ui.select', 'i18n', 'cnr/cnr.search', 'cnr/cnr.criteria', 'json!common', 'cnr/cnr.ui', 'json!cache'], function ($, Node, Select, i18n, Search, Criteria, common, UI, cache) {



  "use strict";



  var defaults = {

      buttonUploadLabel : i18n['button.upload.document'],

      search: {

        type: 'cmis:document',

        baseType: 'cmis:document',

        fetchCmisObject: false,

        maxItems: 1000

      },

      submission: {

        requiresFile: true,

        showFile: true,

        externalData: [],

        callback : function (attachmentsData, data) {}

      },

      forbidArchives : true,

      maxUploadSize : false

    };



  function determinateType(settings) {

    var type = settings.search.type + ' AS ' + settings.search.type;
	
	console.log("type "+type+" j "+JSON.stringify(type));

    if (settings.search.join) {

      type += ' join ' + settings.search.join + ' AS ' + settings.search.join + ' on ' +

        settings.search.join + '.cmis:objectId = ' + settings.search.type + '.cmis:objectId';

    }

    return type;

  }



  function determinateTypeForQuery(parentType, settings) {

    if (settings.search.includeAspectOnQuery !== false && settings.search.baseType) {

      var mandatoryAspects,

        type = settings.search.baseType + ' AS ' + settings.search.baseType,

        aspectQuery;

      $.each(cache.jsonlistTypeWithMandatoryAspects, function (index, el) {

        if (el.key.substring(2) === settings.search.baseType) {

          mandatoryAspects = el.mandatoryAspects;

        }

      });

      if (mandatoryAspects) {

        $.each(mandatoryAspects, function (index, el) {

          aspectQuery = el.substring(2);

          type += ' join ' + aspectQuery + ' AS ' + aspectQuery + ' on ' +

            aspectQuery + '.cmis:objectId = ' + settings.search.baseType + '.cmis:objectId';

        });

      }

      if (settings.search.join) {

        type += ' join ' + settings.search.join + ' AS ' + settings.search.join + ' on ' +

          settings.search.join + '.cmis:objectId = ' + settings.search.baseType + '.cmis:objectId';

      }

      return type;

    }

    return parentType;

  }



  function buildAllegati(settings) {

    var pagination = $('<div class="pagination pagination-centered"><ul></ul></div>'),

      displayTable = $('<table class="table table-striped"></table>'),

      emptyResultset = $('<div class="alert pagination-centered"></div>').hide().append(settings.search.label ? i18n[settings.search.label] : i18n['label.count.no.document']),

      blocco = $('<div class="control-group filter"></div>'),

      allegati = new Search({

        filter: {

          getType: function () {

            return determinateTypeForQuery(allegati.changeType(), settings);

          }

        },

        elements: {

          table: displayTable,

          pagination: pagination,

          label: emptyResultset,

          filter: blocco

        },

        mapping: settings.search.mapping,

        disableRequestReplay: settings.search.type + '_' + settings.search.join,

        type: determinateType(settings),

        fetchCmisObject: settings.search.fetchCmisObject,

        orderBy: settings.search.orderBy,

        calculateTotalNumItems: settings.search.calculateTotalNumItems,

        maxItems: settings.search.maxItems,

        refreshFn : settings.refreshFn,

        display : {

          row : settings.search.displayRow,

          after : function (documents, refreshFn, resultSet, isFilter) {

            if (typeof settings.search.displayAfter === 'function') {

              settings.search.displayAfter(documents, refreshFn, resultSet, isFilter);

            }

            if ((settings.search.filterOnType !== false && allegati.changeType() !== determinateType(settings)) ||

                !settings.search.filterOnType) {

              blocco.show();

            } else {

              blocco.hide();

            }

          }

        }

      }),

      criteria = new Criteria();



    settings.affix

      .append(displayTable)

      .append(pagination)

      .append(emptyResultset);



    if (settings.search.filter !== false) {

      displayTable.before(blocco);

    }

    criteria.inFolder(settings.cmisObjectId, settings.search.type);



    return {

      search: allegati,

      criteria: criteria

    };

  }



  function attachments(opts) {


console.log(" opts "+opts+" j  "+JSON.stringify(opts));
    var settings = $.extend({}, defaults, opts),

      buttonUpload = $('<button type="button" class="btn btn-small" style="position: absolute; margin-left: 220px;"><i class="icon-circle-arrow-up"></i> Aggiungi</button>'),
	  
	   buttonUpload2 = $('<button type="button" class="btn btn-small" style="position: absolute; margin-left: 220px;"><i class="icon-circle-arrow-up"></i> Aggiungi</button>'),

      buttonRefresh = $('<button type="button" class="btn btn-small" style="position: absolute;margin-left: 340px; margin-top: 25px; display: inline-block;"><i class="icon-refresh"></i></button>'),

      divSimpleControl = $('<div class="control-group" style="border: 2px solid rgba(0, 0, 0, 0.2); box-shadow: 1px 2px 1px rgba(0, 0, 0, 0.2); border-radius: 5px; height: 156px;">').addClass(settings.selectGroupClass),

      defaultObjectType,
	  
	  defaultObjectType2,

      selectObjectType = Select.Widget(null, 'Tipologia', {

        jsonlist : settings.objectTypes,

        width : settings.selectWidth,

        placeholder : 'Selezionare tipologia',

        'class': 'input-xlarge'

      }).addClass(settings.selectGroupClass),

      allegati = buildAllegati(settings),

      search = allegati.search,

      criteria = allegati.criteria,

      hr = settings.affix.find('hr:first');
	  
	  
	  


    buttonRefresh

      .tooltip({

        html: true,

        title: i18n['button.upload.update']

      });

    selectObjectType.find('.select2-container')

      .tooltip({

        html: true,

        title: 'Per visualizzare <u>tutti</u> gli elementi gia\' inseriti non selezionare alcuna tipologia'

      });
	  
	  



    selectObjectType

      .addClass('novalidate')

      .on('setData', function (event, key, value, initial) {

    /*    if (key === 'value') {

          if (value) {

            buttonUpload.attr('disabled', null).removeClass('disabled');

          } else {

            buttonUpload.attr('disabled', 'disabled').addClass('disabled');

          }

        } */

        if (settings.otherButtons) {

          $.each(settings.otherButtons, function (i, otherButton) {

            if (value) {

              otherButton.button.attr('disabled', null).removeClass('disabled');

            } else {

              otherButton.button.attr('disabled', 'disabled').addClass('disabled');

            }

          });

        }

        if (value) {

          var objectType = value.substring(2),

            type = objectType + ' AS ' + objectType;

          if (settings.search.isAspect) {

            type += ' join ' + settings.search.type + ' AS ' + settings.search.type + ' on ' +

              objectType + '.cmis:objectId = ' + settings.search.type + '.cmis:objectId';

          }

          if (settings.search.join) {

            type += ' join ' + settings.search.join + ' AS ' + settings.search.join + ' on ' +

              settings.search.join + '.cmis:objectId = ' + settings.search.type + '.cmis:objectId';

          }

          search.changeType(type);

          settings.search.baseType = objectType;

          criteria = new Criteria();

          criteria.inFolder(settings.cmisObjectId, objectType).list(search);

        } else {

          if (!initial) {

            search.changeType(determinateType(settings));

            settings.search.baseType = settings.search.type;

            criteria = new Criteria();

            criteria.inFolder(settings.cmisObjectId, settings.search.type).list(search);

          }

        }



      })

      .find('.controls')

      .trigger('setData', ['value', selectObjectType.data('value'), true])

      .append(' ')

      .append(buttonUpload)
	  
	  .append(buttonUpload2)

      .append(' ')

      .append(buttonRefresh);



    if (settings.objectTypes.length === 2) {
		
      defaultObjectType = settings.objectTypes[0].key;
	  
	  defaultObjectType2 = settings.objectTypes[1].key;
	  

      buttonUpload.attr('disabled', null).removeClass('disabled');

      if(settings.objectTypes[0].key.includes("esperienza_professionale")){
    	  opts.objectTypes[0].defaultLabel="Esperienza professionale/Esperienza dirigenziale nella PA";
		
      divSimpleControl
	  
		.append('<span style="padding-left: 350px; position: absolute; font-weight: bold; margin-top: 10px;" >Tipologia</span><br style="line-height: 47px;">')

       .append('  <span style="font-weight: bold;padding-left: 10px; width: 50%;display: inline-block;"">'+opts.objectTypes[0].defaultLabel+'</span>')
		
		.append(buttonUpload)

        .append(buttonRefresh)

        .append('<br><br> <span style="font-weight: bold;padding-left: 10px; width: 50%;display: inline-block;" ">'+opts.objectTypes[1].defaultLabel+'</span>')
	
        .append(buttonUpload2);
      }else{
    	  divSimpleControl
    	  
  		.append('<span style="padding-left: 350px; position: absolute; font-weight: bold; margin-top: 10px;" >Tipologia</span><br style="line-height: 47px;">')

         .append('  <span style="font-weight: bold;padding-left: 10px; width: 50%;display: inline-block;"">'+opts.objectTypes[0].defaultLabel+'</span>')
  		
  		.append(buttonUpload)

          .append(buttonRefresh)

          .append('<br><br> <span style="font-weight: bold;padding-left: 10px; width: 50%;display: inline-block;" ">'+opts.objectTypes[1].defaultLabel+'</span>')
  	
          .append(buttonUpload2);
      }
		
		

      if (hr.length !== 0) {

        hr.after(divSimpleControl);

      } else {

        settings.affix.prepend(divSimpleControl);

      }

    } else {

      if (hr.length !== 0) {

        hr.after(selectObjectType);

      } else {

        settings.affix.prepend(selectObjectType);

      }

    }

    buttonRefresh

      .click(function () {

        criteria.list(search);

      });

    buttonUpload

      .click(function () {

        if (typeof opts.isSaved === 'function' && !opts.isSaved()) {

          UI.alert('Prima di iniziare la compilazione della sezione &egrave; necessario effettuare il salvataggio!');

          return;

        }

        var type = defaultObjectType || selectObjectType.data('value');
	  
	 //  var type = "D:jconon_scheda_anonima:esperienza_professionale";

        Node.submission({

          nodeRef: settings.cmisObjectId,

          objectType: type,

          crudStatus: "INSERT",

          requiresFile: settings.submission.requiresFile,

          showFile: settings.submission.showFile,

          externalData: settings.submission.externalData,

          multiple: settings.submission.multiple,

          bigmodal: settings.submission.bigmodal,

          callbackModal: settings.submission.callbackModal,

          modalTitle: i18n[type],

          input: settings.input,

          success: function (attachmentsData, data) {

            if (settings.submission.callback) {

              settings.submission.callback(attachmentsData, data);

            }

            criteria.list(search);

          },

          forbidArchives: settings.forbidArchives,

          maxUploadSize: settings.maxUploadSize

        });
	$(' .modal-body').css('max-height','300px');
      });
	  
	  
	buttonUpload2

      .click(function () {

        if (typeof opts.isSaved === 'function' && !opts.isSaved()) {

          UI.alert('Prima di iniziare la compilazione della sezione &egrave; necessario effettuare il salvataggio!');

          return;

        }

        var type = defaultObjectType2 || selectObjectType.data('value');
	  
	  // var type = "D:jconon_scheda_anonima:precedente_incarico_oiv";

        Node.submission({

          nodeRef: settings.cmisObjectId,

          objectType: type,

          crudStatus: "INSERT",

          requiresFile: settings.submission.requiresFile,

          showFile: settings.submission.showFile,

          externalData: settings.submission.externalData,

          multiple: settings.submission.multiple,

          bigmodal: settings.submission.bigmodal,

          callbackModal: settings.submission.callbackModal,

          modalTitle: i18n[type],

          input: settings.input,

          success: function (attachmentsData, data) {

            if (settings.submission.callback) {

              settings.submission.callback(attachmentsData, data);

            }

            criteria.list(search);

          },

          forbidArchives: settings.forbidArchives,

          maxUploadSize: settings.maxUploadSize

        });
		  $(".in .modal-body").css("max-height","300px");

      });
	  
	  
	  

    if (settings.otherButtons) {

      $.each(settings.otherButtons, function (i, otherButton) {

        selectObjectType.find('.controls')

          .append(' ')

          .append(otherButton.button);

        otherButton.button.off('click').on('click', function () {

          otherButton.add(selectObjectType.data('value'), opts.cmisObjectId, function () {

            criteria.list(search);

          });

        });

      });

    }



    return function showAllegati() {

      criteria.list(search);

    };

  }



  return attachments;



});