/**
 * FirstPersonControls class
 *
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 */
class FirstPersonControls {
    /**
     * Constructor
     * @param  {object} object     Object
     * @param  {object} domElement Dom element
     */
    constructor(object, domElement = document) {
        this.object = object
        this.targetPosition = new THREE.Vector3(0, 2, 0)
        this.targetRotation = new Quaternion()

        this.domElement = domElement

        this.enabled = true

        this.movementSpeed = 1.0
        this.lookSpeed = 0.005

        this.heightSpeed = false
        this.heightCoef = 1.0
        this.heightMin = 0.0
        this.heightMax = 1.0

        this.constrainVertical = false
        this.verticalMin = 0
        this.verticalMax = Math.PI

        this.autoSpeedFactor = 0.0

        if (this.domElement !== document) {
            this.domElement.setAttribute('tabindex', - 1)
        }

        this._contextMenu = this.contextMenu.bind(this)
        this.bindEvents()
    }


    /**
     * BindEvents function
     */
    bindEvents() {
        this.domElement.addEventListener('contextmenu', this._contextmenu, false)
    }

    onRotationChanged(quaternion) {
        this.targetRotation = quaternion;
    }

    onPositionChanged(pos) {
        console.log(this.targetPosition);
        this.targetPosition = pos;
    }

    /**
     * Update function
     * @param  {object} delta Delta
     */
    update(delta) {
        if (this.enabled === false) {
            return
        }
        this.object.position.lerp(this.targetPosition, 1);
        this.object.quaternion.slerp(this.targetRotation, this.lookSpeed);
    }

    /**
     * ContextMenu function
     * @param  {object} event Event
     */
    contextMenu(event) {
        event.preventDefault()
    }
    /**
     * Dispose function
     */
    dispose() {
        this.domElement.removeEventListener('contextmenu', this._contextmenu, false)
    }
}