export default class ThreeToCannon {
    constructor(mesh) {
        this.mesh = mesh
        this.faces = []
    }

    isIndexed() {
        return this.mesh.geometry.index != null
    }

    getFaces() {
        let indices = [];
        const index = this.mesh.geometry.getIndex()
        for ( let i = 0; i < index.count; i += 3 ) {
            indices.push( index.getX( i ) )
            indices.push( index.getX( i + 1 ) )
            indices.push( index.getX( i + 2 ) )
        }

        return indices
    }

    getVertices() {
        let vertices = []
        let position = this.mesh.geometry.getAttribute( 'position' )
        
        for ( let i = 0; i < position.count; i ++ ) {
            vertices.push( position.getX( i ) )
            vertices.push( position.getY( i ) )
            vertices.push( position.getZ( i ) )
        }

        return vertices
    }
}