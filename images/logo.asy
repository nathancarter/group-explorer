
usepackage( "mathpazo" );
real sc = 15;
pen myblue = rgb( 33/255, 150/255, 243/255 );
label( "\bf Gr\phantom{o}up Expl\phantom{o}rer 3.\phantom{0}", white );
fill( scale( sc ) *  box( (-4,-0.7), (4,0.7) ), myblue );

picture little_cd ( pair center, real radius, int order ) {
    picture result = new picture;
    real theta ( int i ) { return 90 - i * 360 / order; }
    real mar = 20;
    for ( int i = 0 ; i < order ; ++i ) {
        pair point = center + radius * dir( theta( i ) );
        draw( result, scale( sc ) * ( circle( point, 0.06 ) ), white + linewidth(0.5) );
        draw( result, scale( sc ) * (
            arc( center, radius, theta( i ) - mar, theta( i + 1 ) + mar )
        ), white + linewidth(0.35), Arrow );
    }
    return result;
}

add( little_cd( (-2.22,-0.02), 0.17, 3 ) );
add( little_cd( (1,-0.02), 0.16, 3 ) );
add( little_cd( (3.3,0.08), 0.25, 5 ) );
