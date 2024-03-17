import Game from '../interface/index.d';

let prevTime = 0

// Sprite: 고정된 배경 앞에서 움직이는 물체 게임용어인듯??
class Sprite {
  private curFrame = 0
  private elapsed = 0
  image = new Image()
  position = { x: 0, y: 0 }
  velocity = 0
  frames = { max: 1, hold: 10 } as Game.Frames
  width = 0
  height = 0
  animate = false
  ctx = null as CanvasRenderingContext2D | null
  sprites = {} as Partial<Game.Direction>
  opacity = 1
  isEnemy = false
  rotate = 0
  healthBarEl = undefined as HTMLProgressElement | undefined
  name = 'Sprite'
  healthValue = 100

  constructor({
    position,
    velocity = 0,
    image,
    frames = {max: 1, hold: 10},
    ctx,
    spirtes = {},
    animate = false,
    heathBarEl,
    name,
    isEnemy = false, 
    rotate = 0,
    }: Game.Props.Sprite) {
    this.ctx = ctx
    this.position = position
    this.velocity = velocity
    this.frames = frames
    this.sprites = spirtes
    this.image = image
    this.animate = animate
    this.healthBarEl = heathBarEl
    this.isEnemy = isEnemy
    this.rotate = rotate
    if(name) this.name = name
  }  

  get Rect() {
    return {
      top: this.position.y,
      bottom: this.position.y + this.height,
      left: this.position.x,
      right: this.position.x + this.width,
    }
  }

  get Size() {
    return this.width * this.height
  }

  set health (value: number) {
      this.healthValue -= value
      if(this.healthBarEl) this.healthBarEl.value = this.healthValue
  }

  getRect(moveTo: Record<'x' | 'y', undefined | number>) {
    const position = {...this.position}
    if(moveTo.x) position.x + moveTo.x
    if(moveTo.y) position.y + moveTo.y

    return {
      top: position.y,
      bottom: position.y + this.height,
      left: position.x,
      right: position.x + this.width,
    }
  }

  draw() {
    if(!this.ctx) return
    if(!this.width) this.width = this.image.width / this.frames.max
    if(!this.height) this.height = this.image.height
    this.ctx.save()
    if(this.rotate) {
      const transX = this.position.x + this.width / 2
      const transY = this.position.y + this.height / 2
      this.ctx.translate(transX, transY)
      this.ctx.rotate(Math.PI / this.rotate)
      this.ctx.translate(-1 * transX, -1 * transY)
    }
    this.ctx.globalAlpha = this.opacity
    this.ctx.drawImage(
      this.image,
      this.curFrame * this.width,
      0,
      this.width,
      this.height,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    )
    this.ctx.restore()
    if(!this.animate) return
    if(this.frames.max > 1) this.elapsed++ 
    if(!(this.elapsed % (this.frames?.hold??10))) this.curFrame = this.curFrame < this.frames.max - 1 ? this.curFrame + 1 : 0
  }

  addAttackLog (message: string) {
      const attackDesc = document.querySelector(".attackDesc") as HTMLDivElement
      const dialog = document.createElement('p')
      console.log(prevTime - Date.now())
      prevTime = Date.now()
      dialog.innerText = message
      attackDesc.prepend(dialog)
  }

  faint(){
    this.addAttackLog(`${this.name} is Lose`)
  }

  async attack({
    attack,
    recipient,
    renderLayer,
  }:{
    attack: Game.Attack,
    recipient: Sprite, 
    renderLayer: RenderLayers<Sprite>, 
  }) {
    prevTime = Date.now()
    if(attack.name === 'Tackle') {
      const moveX = this.isEnemy ? -20 : 20
      await this.moveTo({x: moveX * -1})
      await this.moveTo({x: moveX * 2}, {duration: 0.1})
      await recipient.moveTo({x: 10}, { repeat: 5, duration: 0.08, opacity: 0 })
      recipient.health = attack.damage
    } else if (attack.name === 'FireBall') {
      const fireBallImage = new Image()
      fireBallImage.src = './asset/fireball.png'
      const fireBall = new Sprite({
        name: 'FireBall',
        position: {...this.position},
        image: fireBallImage,
        ctx: this.ctx as CanvasRenderingContext2D,
        frames: {
          max: 4,
          hold: 10
        },
        animate: true,
      })

      const moveX = this.isEnemy ? -20 : 20
      await this.moveTo({x: moveX * -1})
      await this.moveTo({x: moveX * 2}, {duration: 0.1 })
      const distance = {x: recipient.position.x - this.position.x , y: recipient.position.y - this.position.y }
      renderLayer.setLayers(prev => [...prev, fireBall])
      await fireBall.moveTo(distance, {
        duration: 0.8,
        repeat: 0,
        rotate: this.isEnemy ? -2.2 : 1,
      })
      renderLayer.setLayers(prev => prev.filter(layer => layer !== fireBall))
      await recipient.moveTo({x: 10}, { repeat: 5, duration: 0.08, opacity: 0})
      recipient.health = attack.damage
    }
    this.addAttackLog(attack.message(this.name, recipient.name))
  }

  async moveTo (position: Partial<Game.Position>, {duration = 0.2, repeat = 1, opacity = 1, rotate = 0}: Game.MoveToOptions = {}) {
    return new Promise((resolve) => {
      let startTime = 0
      let aniCount = 0
      let frameId = 0

      let startX = this.position.x
      let startY = this.position.y
      let moveX = position.x ?? 0
      let moveY = position.y ?? 0
      const step = (timestamp: number) => {
        if(!startTime) startTime = timestamp
        const diff = timestamp - startTime
        const durationTime = duration * 1000
        const progress = Math.min(diff / durationTime, 1)
        const nextX = startX + (moveX * progress)
        const nextY = startY + (moveY * progress)
        const nextOpacity = Math.max(progress, opacity)
        this.position.x = nextX
        this.position.y = nextY
        this.opacity = nextOpacity
        this.rotate = progress * rotate
        this.draw()
        if(diff < durationTime) frameId = requestAnimationFrame(step)
        else {
        if(repeat > aniCount) {
          this.opacity = 1
          aniCount += 1
          startTime = 0
          moveX = -1 * moveX
          moveY = -1 * moveY
          startX = this.position.x
          startY = this.position.y
          frameId = requestAnimationFrame(step)
          } else { 
            cancelAnimationFrame(frameId)
            resolve(true)
          }
        }
      }
      frameId = requestAnimationFrame(step)
    })
  }
}

class Boundary {
  position = { x: 0, y: 0 }
  static width = 48
  static height = 48
  color = 'rgba(0,0,0,0)'
  ctx = null as CanvasRenderingContext2D | null
  constructor(position: Game.Position, ctx: CanvasRenderingContext2D, fillColor?: string){
    this.position = position
    this.ctx = ctx
    if(fillColor) this.color = fillColor
  }
  
  get Rect() {
    return {
      top: this.position.y,
      bottom: this.position.y + Boundary.height,
      left: this.position.x,
      right: this.position.x + Boundary.width,
    }
  }

  getRect(moveTo: Record<'x' | 'y', undefined | number>) {                                                                    
    const position = {...this.position}
    if(moveTo.x) position.x  += moveTo.x
    if(moveTo.y) position.y +=  moveTo.y
    
    return {
      top: position.y,
      bottom: position.y + Boundary.height,
      left: position.x,
      right: position.x + Boundary.width,
    }
  }

  draw(){
    if(!this.ctx) return
    this.ctx.fillStyle =  this.color
    this.ctx.fillRect(this.position.x, this.position.y, Boundary.width, Boundary.height)
  }
}

class RenderLayers<Layer extends (Sprite | Boundary)> {
  layers: Layer[] = []
  constructor (initalLayers: Layer[]) {
    this.layers = initalLayers
  }

  setLayers (layers: Layer[] | ((prevLayers: Layer[]) => Layer[])) {
    const nextLayer = typeof layers === 'function' ? layers(this.layers) : layers
    this.layers = nextLayer
  }

  draw(){
    this.layers.forEach(layer => layer.draw())
  }
}


class Battle {
  attackDisplay = document.getElementById('attackDisplay') as HTMLDivElement
  initial = false
  lastBattleTime = 0
  isBattle = false
  draggle: Sprite
  emby: Sprite
  background: Sprite

  constructor(){
  const draggeHeathBar = document.getElementById('draggle-healthBar') as HTMLProgressElement
  const embyHealthBar = document.getElementById('emby-healthBar') as HTMLProgressElement
  const flush = document.getElementById('flush')
  const canvas = document.querySelector('canvas')
  const ctx = canvas?.getContext('2d')!
  if(!canvas || !ctx) throw alert("CAN'T NOT FIND CANVAS")
  if(!flush) throw alert("CAN'T NOT FIND FLUSH")
  const battleBackgroundImage = new Image()
  battleBackgroundImage.src = './asset/battleBackground.png'

  const draggleImage = new Image()
  draggleImage.src = './asset/draggleSprite.png'

  const embyImage = new Image()
  embyImage.src = './asset/embySprite.png'

  this.background = new Sprite({position: { x: 0, y:0 }, image: battleBackgroundImage, ctx})

  this.draggle = new Sprite({
                    name: `Draggle`,
                    position: { x: 800, y: 100 },
                    image: draggleImage,
                    frames: { max: 4, hold: 30 },
                    animate: true,
                    isEnemy: true,
                    heathBarEl: draggeHeathBar,
                    ctx
                  })
   this.emby = new Sprite({
                  name: `Emby`,
                  position: { x: 280, y: 325 },
                  image: embyImage,
                  frames: { max: 4, hold: 30 },
                  animate: true,
                  heathBarEl: embyHealthBar,
                  ctx
                })
  }

  inital(){
    this.emby.healthValue = 100
    this.draggle.healthValue = 100
    Array.from(this.attackDisplay.children).forEach((v, i, a) => a.length > 1 && i < a.length - 1 && this.attackDisplay.removeChild(v))
  }
}

export { Boundary, RenderLayers, Sprite };
