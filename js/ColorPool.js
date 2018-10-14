 class ColorPool {
   static init() {
      /*
       * Distinct colors that show up well on CayleyDiagram.BACKGROUND_COLOR
       * from https://sashat.me/2017/01/11/list-of-20-simple-distinct-colors
       */
      ColorPool.colors = [
         '#911eb4',  /* purple */
         '#469990',  /* teal */
         '#808000',  /* olive */
         '#e6194b',  /* red */
         '#ffffff',  /* white */
         '#f58231',  /* orange */
         '#000000',  /* black */
         '#f032e6',  /* magenta */
         '#4363d8',  /* blue */
         '#3cb44b',  /* green */
         '#800000',  /* maroon */
      ];
   }

   static pushCSS(color) {
      ColorPool.colors.push(color);
   }

   static popCSS() {
      return ColorPool.colors.pop();
   }

   static popHex() {
      return new THREE.Color(ColorPool.popCSS()).getHex();
   }
}

ColorPool.init();
