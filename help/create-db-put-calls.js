
const fs = require( 'fs' );
const { exec } = require( 'child_process' );

function processOneFile ( filename, callback ) {
    const cmd = `lynx --dump --nolist ${filename}`;
    exec( cmd, ( err, stdout, stderr ) => {
        if ( err ) {
            console.error( 'Could not execute this command: '
              + cmd );
            process.exit( 1 );
        }
        const words = stdout.split( /\s+/ );
        const unique = words.filter( ( value, index, self ) =>
            self.indexOf( value ) === index );
        const realWords = unique.filter( thing =>
            /^[a-zA-Z0-9']+$/.test( thing ) );
        callback( `db.PUT( { _id : "${filename}", `
          + `content : "${realWords.sort().join( ' ' )}" } );` );
    } );
}

function processFolder ( path, callback ) {
    fs.readdir( path, ( err, files ) => {
        if ( err ) {
            console.error( 'Could not get file list here: '
              + path );
            process.exit( 1 );
        }
        files = files.filter( name => /\.html$/.test( name ) );
        var results = Array( files.length );
        var count = 0;
        files.sort().forEach( ( file, index ) => {
            processOneFile( file, ( result ) => {
                results[index] = result;
                if ( ++count == files.length )
                    callback( results );
            } );
        } );
    } );
}

processFolder( '.', ( results ) => {
    const code = 'function setupDB ( db ) {\n'
               + `\t${results.join( '\n\t' )}\n`
               + '}';
    const outfile = 'setup-db.js';
    fs.writeFile( outfile, code, ( err ) => {
        if ( err )
            console.error( err );
        else
            console.log( `Code written to ${outfile}.` );
    } );
} );

