// @flow
/*
 * Class holds group info parsed from xml definition
 *
 * To turn to JSON:
 *      JSON.stringify(instance)
 * To create from JSON:
 *      XMLGroup.parseJSON(json)
 */

import BasicGroup from './BasicGroup.js';
import BitSet from './BitSet.js';
import MathML from './MathML.js';
import Subgroup from './Subgroup.js';

/*::
import type {BasicGroupJSON} from './BasicGroup.js';

// Cayley diagram from XML
export type XMLCayleyDiagram = {
   name: string,
   arrows: Array<groupElement>,
   points: Array<Point>
};

// Symmetry object from XML
type Point = [float, float, float];
type Path = {color?: color, points: Array<Point>};
type Sphere = {radius: float, color?: color, point: Point};
type Operation = {element: groupElement, degrees: float, point: Point};
export type XMLSymmetryObject = {
   name: string,
   operations: Array<Operation>,
   spheres: Array<Sphere>,
   paths: Array<Path>
};

export type XMLGroupJSON = {
   name: mathml,
   gapname: string,
   gapid: string,
   shortName: string,
   definition: mathml,
   phrase: string,
   notes: string,
   author: string,
   _XML_generators: Array<Array<groupElement>>,
   reps: Array<Array<string>>,
   representations: Array<Array<mathml>>,
   userRepresentations: Array<Array<string>>,
   representationIndex: number,
   cayleyDiagrams: Array<XMLCayleyDiagram>,
   symmetryObjects: Array<XMLSymmetryObject>,

   // XMLGroup properties set elsewhere
   lastModifiedOnServer: string,
   URL: string,
   CayleyThumbnail: string,
   rowHTML: string,
   userNotes: string
};

export type BriefXMLGroupJSON = {
   name: mathml,
   shortName: string,
   author: string,
   notes: string,
   phrase: string,
   representations: Array<Array<mathml>>,
   representationIndex: number,
   cayleyDiagrams: Array<XMLCayleyDiagram>,
   symmetryObjects: Array<XMLSymmetryObject>,
   multtable: Array<Array<groupElement>>
};
*/

export default
class XMLGroup extends BasicGroup {
/*::
   name: string;
   gapname: string;
   gapid: string;
   shortName: string;
   definition: string;
   phrase: string;
   notes: string;
   author: string;
   _XML_generators: Array<Array<groupElement>>;
   reps: Array<Array<string>>;
   representations: Array<Array<mathml>>;
   userRepresentations: Array<Array<string>>;
   representationIndex: number;
   cayleyDiagrams: Array<XMLCayleyDiagram>;
   symmetryObjects: Array<XMLSymmetryObject>;
   _labels: ?Array<string>;

   lastModifiedOnServer: string;
   URL: string;
   CayleyThumbnail: string;
   rowHTML: string;
   userNotes: string;
 */
   constructor (text /*: void | string | Document */) {
      if (text === undefined) {
         super();
         return;
      }

      let $xml /*: JQuery */;
      if (typeof(text) == 'string') {
         // Replacing named entities with unicode characters to ensure that later fragments parse successfully...
         const cleanText = text.replace(/&Zopf;/g, "ℤ")
                               .replace(/&times;/g, "×")
                               .replace(/&ltimes;/g, "⋉")
                               .replace(/&rtimes;/g, "⋊")
                               .replace(/<br.>/g, "&lt;br/&gt;");  // hack to read fgb notes
         $xml = $($.parseXML(cleanText));
      } else {
         $xml = $(text);
      }

      super(XMLGroup._multtable_from_xml($xml));

      this.name = $xml.find('name').first().html();
      this.gapname = $xml.find('gapname').first().html();
      this.gapid = $xml.find('gapid').first().html();
      this.shortName = $xml.find('name').first().attr('text');
      this.definition = $xml.find('definition').first().html();
      this.phrase = $xml.find('phrase').text();
      this.notes = $xml.find('notes').text();
      this.author = $xml.find('author').text();
      this._XML_generators = XMLGroup._generators_from_xml($xml);
      this.reps = XMLGroup._reps_from_xml($xml);
      this.representations = XMLGroup._representations_from_xml($xml);
      this.userRepresentations = [];
      /*
       * representations and userRepresentations are treated together as a contiguous array,
       *   and representationIndex is the index of the default representation into that virtual array
       *   (representationIndex is an integer and not an object reference so XMLGroup can be easily serialized)
       */
      this.representationIndex = 0;
      this.cayleyDiagrams = XMLGroup._cayley_diagrams_from_xml($xml);
      this.symmetryObjects = XMLGroup._symmetry_objects_from_xml($xml);
      this.userNotes = '';
   }

   static parseJSON(json /*: XMLGroupJSON & BasicGroupJSON & Obj */) /*: XMLGroup */ {
      const group /*: XMLGroup */ = new XMLGroup();
      group.parseJSON(json);
      return group;
   }

   parseJSON(json  /*: XMLGroupJSON & BasicGroupJSON & Obj */) {
      const defaults = {
         name: '<mrow><mtext>Untitled Group</mtext></mrow>',
         shortName: 'Untitled Group',
         author: '',
         notes: '',
         phrase: '',
         representationIndex: 0,
         cayleyDiagrams: [],
         symmetryObjects: [],
      };

      // process BasicGroup properties
      super.parseJSON(json);

      // merge defaults into passed JSON object and remove properties already set in BasicGroup
      const jsonWithDefaults /*: XMLGroupJSON & Obj */ = Object.assign({}, defaults, json);  
      Object.keys(this).forEach( (key /*: string */) => delete jsonWithDefaults[key] );
  
      // copy remaining properties to this
      Object.assign(this, jsonWithDefaults);

      // process XMLGroup properties
      if ( this.representations == undefined ) {
         this.representations = [ [ ] ];
         for ( var i = 0 ; i < this.multtable.length ; i++ )
            this.representations[0].push( `<mn>${i}</mn>` );
      }
   }

   toBriefJSON () /*: BriefXMLGroupJSON */ {
      return {
         name: this.name,
         shortName: this.shortName,
         author: this.author,
         notes: this.notes,
         phrase: this.phrase,
         representations: this.representations,
         representationIndex: this.representationIndex,
         cayleyDiagrams: this.cayleyDiagrams,
         symmetryObjects: this.symmetryObjects,
         multtable: this.multtable
      };
   }

   deleteUserRepresentation(userIndex /*: number */) {
      const savedRepresentation =
         (userIndex + this.representations.length == this.representationIndex) ? this.representations[0] : this.representation;
      this.userRepresentations.splice(userIndex, 1);
      this.representation = savedRepresentation;
   }

   get representation() /*: Array<mathml> */ {
      if (this.representationIndex < this.representations.length) {
         return this.representations[this.representationIndex];
      } else if (this.representationIndex - this.representations.length < this.userRepresentations.length) {
         return this.userRepresentations[this.representationIndex - this.representations.length];
      } else {
         return this.representations[0];
      }
   }

   set representation(representation /*: Array<string> */) {
      let inx = this.representations.findIndex( (el) => el == representation );
      if (inx >= 0) {
         this.representationIndex = inx;
      } else {
         inx = this.userRepresentations.findIndex( (el) => el == representation );
         if (inx >= 0) {
            this.representationIndex = inx + this.representations.length;
         }
      }
      this._labels = undefined;  // representation has changed, invalidate labels
   }

   get representationIsUserDefined () {
      return this.representationIndex >= this.representations.length;
   }

   get rep() /*: Array<mathml> */ {
      return (this.representationIndex < this.representations.length) ? this.reps[this.representationIndex] : this.representation;
   }

   // unicode text for current representation
   get labels() /*: Array<string> */ {
      if (this._labels == undefined) {
         this._labels = this.representation.map( (rep) => MathML.toUnicode(rep) );
      }

      return this._labels;
   }

   get longestLabel() /*: mathml */ {
      return this.labels.reduce/*:: <mathml> */( (longest, label) => (label.length > longest.length) ? label : longest, '' );
   }

   get generators() /*: Array<Array<groupElement>> */ {
      const calculatedGenerators = super.generators;
      if (this._XML_generators.length == 0) {
         return calculatedGenerators;
      } else if (calculatedGenerators[0].length < this._XML_generators[0].length) {
         calculatedGenerators.push(...this._XML_generators);
         return calculatedGenerators;
      } else {
         return this._XML_generators;
      }
   }

   // returns short representations as array of arrays of strings (just debugging)
   static _reps_from_xml($xml /*: JQuery */) /*: Array<Array<string>> */ {
      return $xml.find('representation').toArray()
                 .map( (rep /*: Element */) => $(rep).find('element').toArray()
                                                     .map( (el /*: Element */) => $(el).attr('text') )
                     );
   }

   // returns representations as array of arrays of innerHTML elements
   static _representations_from_xml($xml /*: JQuery */) /*: Array<Array<mathml>> */ {
      return $xml.find('representation').toArray()
                 .map( (rep /*: Element */) => $(rep).find('element').toArray()
                                                     .map( (el /*: Element */) => $(el).html() )
                     );
   }

   // returns <multtable> in [[],[]] format
   static _multtable_from_xml($xml /*: JQuery */) /*: Array<Array<groupElement>> */ {
      return $xml.find('multtable > row').toArray()
                 .map( (row /*: Element */) => row.textContent
                                                  .split(' ')
                                                  .filter( (el /*: string */) => el.length != 0 )
                                                  .map( (el /*: string */) => parseInt(el) )
                     );
   }

   // returns generators specified in XML, not those derived in subgroup computation
   static _generators_from_xml($xml /*: JQuery */) /*: Array<Array<groupElement>> */ {
      return $xml.find('generators').toArray()
                 .map( (gen /*: Element */) => $(gen).attr('list')
                                                     .split(' ')
                                                     .map( (gen /*: string */) => parseInt(gen) )
                     )
   }

   // {name, arrows, points}
   // arrows are element numbers
   // points are [x,y,z] arrays
   static _cayley_diagrams_from_xml($xml /*: JQuery */) /*: Array<XMLCayleyDiagram> */ {
      let cayleyDiagrams = [];
      $xml.find('cayleydiagram').each(
         (_, cd) => {
            let name, arrows = [], points = [];
            name = $(cd).find('name').text();
            $(cd).find('arrow').each( (_, ar) => { arrows.push(Number(ar.textContent)) } );
            $(cd).find('point').each( (_, pt) => {
               let x = Number(pt.getAttribute('x')),
                   y = Number(pt.getAttribute('y')),
                   z = Number(pt.getAttribute('z'));
               points.push([x,y,z]);
            } );
            cayleyDiagrams.push({name: name, arrows: arrows, points: points});
         }
      )
      return cayleyDiagrams;
   }

   static _symmetry_objects_from_xml($xml /*: JQuery */) /*: Array<XMLSymmetryObject> */ {
      let getPoint = function(pt) {
         return [Number(pt.getAttribute('x')), Number(pt.getAttribute('y')), Number(pt.getAttribute('z'))];
      };
      let symmetryObjects = [];
      $xml.find('symmetryobject').each(
         (_, so) => {
            const name = so.getAttribute('name') || '(unnamed)',
                  operations = [],
                  spheres = [],
                  paths = [];
            $(so).find('operation').each(
               (_, op) => {
                  const element = Number(op.getAttribute('element')),
                        degrees = Number(op.getAttribute('degrees')),
                        point = getPoint(op.children[0]);
                  operations.push({element: element, degrees: degrees, point: point});
               }
            );
            $(so).find('sphere').each(
               (_, sp) => {
                  const radius = Number(sp.getAttribute('radius')),
                        color = sp.getAttribute('color'),
                        point = getPoint(sp.children[0]);
                  const sphere /*: Sphere */ = {radius: radius, point: point};
                  if (color != undefined)
                     sphere.color = color;
                  spheres.push(sphere);
               }
            );
            $(so).find('path').each(
               (_, pa) => {
                  const path /*: Path */ = {points: []};
                  const color = pa.getAttribute('color');
                  if (color != undefined)
                     path.color = color;
                  $(pa).find('point').each(
                     (_, pt) => {
                        path.points.push(getPoint(pt));
                     }
                  );
                  paths.push(path);
               }
            );
            symmetryObjects.push(
               {name: name, operations: operations, spheres: spheres, paths: paths}
            )
         }
      )
      return symmetryObjects;
   }

   bitsetToRepString(bitset /*: BitSet */) /*: string */ {
      return bitset.toArray().map( (el /*: groupElement */) => this.reps[el] ).join(', ');
   }

   subgroupToRepString(subgroup /*: Subgroup */) /*: string */ {
      return `generators: ${this.bitsetToRepString(subgroup.generators)}}; ` +
             `members: ${this.bitsetToRepString(subgroup.members)}`;
   }
}
