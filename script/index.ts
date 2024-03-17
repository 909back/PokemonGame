import map from './map.js'
import Game from './interface/index.d';
import { Boundary, RenderLayers, Sprite } from './classes/index.js';
const {collisions, battleZones: battleZonesData} = map

/**
 * @TODO 충돌, 배틀시작 등 로그 창 띄우기
 * @TODO 화살표 방향 창 띄우기(on/off) 가능
 */

const attackDisplay = document.getElementById('attackDisplay') as HTMLDivElement
const attackBtns = document.querySelectorAll('.attackButton') as NodeListOf<HTMLButtonElement>
const draggeHeathBar = document.getElementById('draggle-healthBar') as HTMLProgressElement
const embyHealthBar = document.getElementById('emby-healthBar') as HTMLProgressElement
const flush = document.getElementById('flush')
const canvas = document.querySelector('canvas')
const ctx = canvas?.getContext('2d')!
if(!canvas || !ctx) throw alert("CAN'T NOT FIND CANVAS")
if(!flush) throw alert("CAN'T NOT FIND FLUSH")

const collisionsMap = [] as number[][]
for (let i = 0; i < collisions.length; i += 70) {
  collisionsMap.push(collisions.slice(i, i + 70))
}

const battleZoneMap = [] as number[][]
for (let i = 0; i < battleZonesData.length; i += 70) {
  battleZoneMap.push(battleZonesData.slice(i, i + 70))
}

const offset = {
  x: -735,
  y: -610
}

const boundaries = [] as Boundary[]
collisionsMap.forEach((row, i) => {
  row.forEach((r, j) => {
    if(r === 1025) 
      boundaries.push(
        new Boundary({
          x: j * Boundary.width + offset.x,
          y: i * Boundary.height + offset.y},
          ctx))
  })
})

const battleZones = [] as Boundary[]
battleZoneMap.forEach((row, i) => {
  row.forEach((r, j) => {
    if(r === 1025) 
      battleZones.push(
        new Boundary({
          x: j * Boundary.width + offset.x,
          y: i * Boundary.height + offset.y
        }, ctx))
  })
})

const step = 3

canvas.width = 1024;
canvas.height = 576;

ctx.fillStyle = 'white'
ctx.fillRect(0, 0, canvas.width, canvas.height)

// image objects
const backgroundImage = new Image()
backgroundImage.src = './asset/Pellet_Town.png'

const foregroundImage = new Image()
foregroundImage.src = './asset/foreground.png'

const playerDownImage = new Image()
playerDownImage.src = './asset/playerDown.png'

const playerUpImage = new Image()
playerUpImage.src = './asset/playerUp.png'

const playerLeftImage = new Image()
playerLeftImage.src = './asset/playerLeft.png'

const playerRightImage = new Image()
playerRightImage.src = './asset/playerRight.png'



// initial Pos
let playerPosX = canvas.width / 2 - 192 / 8
let playerPosY = canvas.height / 2 - 68 / 2


const keys = {
  'ArrowDown': {
    pressed: false
  },
  'ArrowUp': {
    pressed: false
  },
  'ArrowRight': {
    pressed: false
  },
  'ArrowLeft': {
    pressed: false
  }
}

let lastKey = 'ArrowDown' as keyof typeof keys

const battle = {
  initiated: false,
  lastBattleTime: 0
}

const background = new Sprite({position: offset, image: backgroundImage, ctx})
const player = new Sprite({
  ctx,
  position: {
    x: playerPosX,
    y: playerPosY
  },
  image: playerDownImage,
  frames: { max: 4 },
  spirtes: {
    up: playerUpImage,
    down: playerDownImage,
    left: playerLeftImage,
    right: playerRightImage,
  }
})

const foreground = new Sprite({position: {x: offset.x, y: offset.y}, image: foregroundImage, ctx})

function calcRectCollision (rect1: Game.Rectangular, rect2: Game.Rectangular) {
  const detectRight = rect1.right >= rect2.left
  const detectLeft = rect1.left <= rect2.right
  const detectBottom = rect1.bottom >= rect2.top
  const detectTop = rect1.top <= rect2.bottom
  return detectTop && detectBottom && detectLeft && detectRight
}

const getOverlappingSize = (rect1: Game.Rectangular, rect2: Game.Rectangular) => {
  const overlapWidth = Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left) 
  const overlapHeight =  Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top)
  return Math.max(overlapWidth, 0) * Math.max(overlapHeight, 0)
}

const calcBoundary = () => {
  return boundaries.some(boundary => {
    const pos = { x: 0, y: 0}
    if(keys.ArrowUp.pressed) pos.y += step
    else if(keys.ArrowDown.pressed) pos.y -= step
    else if(keys.ArrowLeft.pressed) pos.x += step
    else if(keys.ArrowRight.pressed) pos.x -= step
    const bRect = boundary.getRect(pos)
    return calcRectCollision(player.Rect, bRect)
  })
}

const battleBackgroundImage = new Image()
battleBackgroundImage.src = './asset/battleBackground.png'


const draggleImage = new Image()
draggleImage.src = './asset/draggleSprite.png'

const embyImage = new Image()
embyImage.src = './asset/embySprite.png'

const battleBackground = new Sprite({position: { x: 0, y:0 }, image: battleBackgroundImage, ctx})
const emby = new Sprite({
  name: `Emby`,
  position: { x: 280, y: 325 },
  image: embyImage,
  frames: { max: 4, hold: 30 },
  animate: true,
  heathBarEl: embyHealthBar,
  ctx
})

const draggle = new Sprite({
  name: `Draggle`,
  position: { x: 800, y: 100 },
  image: draggleImage,
  frames: { max: 4, hold: 30 },
  animate: true,
  isEnemy: true,
  heathBarEl: draggeHeathBar,
  ctx
})

let battleFrameId = 0
const battleLayers = new RenderLayers([battleBackground, emby, draggle])
function animateBattle(){
  battleFrameId = requestAnimationFrame(animateBattle)
  battleLayers.draw()
}

const endBattle = (loserName: string) => {
  if(attackDisplay) attackDisplay.style.display = 'none'
  flush.innerText = `${loserName} is Lose..`
  flush.classList.replace('fadein','fadeout')
  const handleAnimationEnd = () => {
    flush.classList.replace('fadeout', 'fadein')
    cancelAnimationFrame(battleFrameId)
    battle.initiated = false
    battle.lastBattleTime = Date.now()
    flush.innerText = ''
    animate()
    flush.removeEventListener('animationend', handleAnimationEnd)
  }
  flush.addEventListener('animationend', handleAnimationEnd)
}

const startBattle = () => {
  flush.classList.add('fadeout')
  const handleAnimationEnd = () => {
    flush.removeEventListener('animationend', handleAnimationEnd)
    flush.classList.replace('fadeout', 'fadein')
    if(attackDisplay) attackDisplay.style.display = 'block'
    animateBattle()
  }
  flush.addEventListener('animationend', handleAnimationEnd)
}

const calcBattle = () => {
    return battleZones.some(battleZone => {
    const pos = { x: 0, y: 0}
    if(keys.ArrowUp.pressed) pos.y += step
    else if(keys.ArrowDown.pressed) pos.y -= step
    else if(keys.ArrowLeft.pressed) pos.x += step
    else if(keys.ArrowRight.pressed) pos.x -= step
    const bRect = battleZone.getRect(pos)
    const isOverLapped = getOverlappingSize(player.Rect, bRect) > (player.Size / 2)
    const randomChance = Math.random() < 0.01
    const afterBattle = battle.lastBattleTime < Date.now() - 10 * 1000
    return calcRectCollision(player.Rect, bRect) && isOverLapped && randomChance && afterBattle
  })
}

const movableLayers = [background, ...boundaries, ...battleZones, foreground]
function animate (timestamp?: number) {
  const animationId =  requestAnimationFrame(animate)
  background.draw()
  boundaries.forEach(b => b.draw())
  battleZones.forEach(b => b.draw())
  player.draw()
  foreground.draw()

  const direction = Object.entries(keys).find(([_, key]) => !!key.pressed)?.[0] as typeof lastKey
  player.animate = !!direction

  if(direction) {
    lastKey = direction
    player.image = player.sprites[(((direction??lastKey).replace('Arrow', ''))?.toLowerCase() as keyof Game.Direction)]
    const isPath = !calcBoundary()
    const isBattleZone = calcBattle()
    if(isBattleZone) {
      cancelAnimationFrame(animationId)
      battle.initiated = true
      startBattle()
    }
    if(direction === 'ArrowDown') {
      isPath && movableLayers.forEach(layer => { layer.position.y -= step })
    } else if (direction === 'ArrowUp') {
      isPath && movableLayers.forEach(layer => { layer.position.y += step })
    } else if (direction === 'ArrowRight') {
      isPath && movableLayers.forEach(layer => { layer.position.x -= step })
    } else if (direction === 'ArrowLeft') {
      isPath && movableLayers.forEach(layer => { layer.position.x += step })
    }
  }
}

animate()

const attackType: Record<Game.Attack.Name, Game.Attack> = {
  Tackle: {
    name: 'Tackle',
    damage: 10,
    type: 'Normal',
    message: (...arg: string[]) => `[system] ${arg[0]} 가 ${arg[1]}에게 태클을 걸었습니다.`
  },
  FireBall: {
    name: 'FireBall',
    damage: 25,
    type: 'Fire',
    message: (...arg: string[]) => `[system] ${arg[0]} 가 ${arg[1]} 에게 파이어볼을 던졌습니다.`
  }
}

attackBtns.forEach(btn => {
  btn.addEventListener('click', async (e: MouseEvent) => {
    attackBtns.forEach(b => { b.disabled = true })
    if(!battle.initiated) return 
    const attack = attackType[((e.currentTarget as HTMLButtonElement).value) as Game.Attack.Name]
    await emby.attack({attack,recipient: draggle,renderLayer: battleLayers})
    if(Math.floor(Math.random() * 10) > 4) await draggle.attack({attack: attackType.Tackle, recipient: emby, renderLayer: battleLayers})
    attackBtns.forEach(b => { b.disabled = false })
    const loser = emby.healthValue < 0 ? emby : draggle.healthValue < 0 ? draggle : undefined
    if(loser) return endBattle(loser.name)
  })
})

window.addEventListener('keydown', (e) => {
  if(e.isComposing) return

  const key = Object.keys(keys).includes(e.key) ? (e.key as keyof typeof keys) : undefined
  if(key) keys[key].pressed = true
})

window.addEventListener('keyup', (e) => {
  if(e.isComposing) return
  const key = Object.keys(keys).includes(e.key) ? (e.key as keyof typeof keys) : undefined
  if(key) keys[key].pressed = false
})

