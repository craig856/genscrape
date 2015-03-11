var debug = require('debug')('ancestry-ancestor'),
    utils = require('../utils'),
    request = require('superagent'),
    jquery = require('jquery');

var urls = [
  utils.urlPatternToRegex('http://trees.ancestry.com/tree/*/person/*'),
  utils.urlPatternToRegex('http://trees.ancestryinstitution.com/tree/*/person/*')
];

module.exports = function(register){
  register(urls, run);
};

function run(emitter) {
  
  try {
  
    var $ = jquery(window);
  
    // Get the name
    var nameParts = utils.splitName( $('.pInfo h1').html() );
    
    var personData = {
      'givenName': nameParts[0],
      'familyName': nameParts[1]
    };
    
    var events = {};
    
    // Gather events
    $('.eventList .eventDefinition').each(function(){
      var event = $(this),
          type = event.find('dt').text().trim().toLowerCase(),
          day = event.find('.eventDay').text().trim(),
          year = event.find('.eventYear').text().trim(),
          place = event.find('.eventPlace').text().trim();
      events[type] = {
        date: day + ' ' + year,
        place: place
      };      
    });
    
    // Birth
    var birth = events.birth || events.christening || null;
    if(birth) {
      personData['birthDate'] = birth.date;
      personData['birthPlace'] = birth.place;
    }
    
    // Death
    var death = events.death || events.burial || null;
    if(death) {
      personData['deathDate'] = death.date;
      personData['deathPlace'] = death.place;
    }
    
    // TODO get the marriage info
    
    //
    // Process relationships
    //
    
    var parentsBlock = $('.famMem .section').eq(0);
    
    // Father's name
    if($('.iconMale.add', parentsBlock).length == 0) {
      var fatherNameParts = utils.splitName( $('.iconMale + .nameandyears a', parentsBlock).text() );
      personData['fatherGivenName'] = fatherNameParts[0];
      personData['fatherFamilyName'] = fatherNameParts[1];
    }
    
    // Mother's name
    if($('.iconFemale.add', parentsBlock).length == 0) {
      var motherNameParts = utils.splitName( $('.iconFemale + .nameandyears a', parentsBlock).text() );
      personData['motherGivenName'] = motherNameParts[0];
      personData['motherFamilyName'] = motherNameParts[1];
    }
    
    // Spouse's name
    var spouseBlock = $('.famMem .section').eq(1);
    if($('.add', spouseBlock).length == 0){
      var spouseNameParts = utils.splitName( $('.main .nameandyears a', spouseBlock).text() );
      personData['spouseGivenName'] = spouseNameParts[0];
      personData['spouseFamilyName'] = spouseNameParts[1];
    }
    
    debug('data');
    emitter.emit('data', personData);
  
  } catch(e) {
    debug('error', e);
    emitter.emit('error', e);
  }

}