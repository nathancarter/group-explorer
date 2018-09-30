
class VC {
   static _init() {
      VC.visualizerLayoutURL = './visualizerFramework/visualizer.html';
   }

   /* Load custom code into visualizer framework */
   static load() {
      return new Promise( (resolve, reject) => {
         $.ajax( { url: VC.visualizerLayoutURL,
                   success: (data) => {
                          const $customCode = $('body').children().detach();
                          $('body').html(data);
                          $('#controls-placeholder').remove();
                          $('#vert-container').prepend($customCode);
                          resolve();
                       },
                       error: (_jqXHR, _status, err) => {
                          reject(`Error loading ${VC.visualizerLayoutURL}: ${err}`);
                       }
             } );
          } )
       }
}

VC._init();
