declare namespace Game {
    interface Position {
        x: number,
        y: number
    }

    interface Frames {
        max: number
        hold?: number
    }

    interface Rectangular {
        top: number,
        bottom: number,
        left: number,
        right: number,
    }

    namespace Attack {
        type Type = 'Normal' | 'Fire'
        type Name = 'Tackle' | 'FireBall'
    }

    interface Attack {
        name: Attack.Name
        damage: number
        type: Attack.Type
        message: (...arg: string[]) => string
    }

    interface MoveToOptions {
        duration?: number
        onComplete?: () => void
        repeat?: number
        opacity?: number
        rotate?: number
    }

    type Direction<T = any>  = Record<'up' | 'down' | 'left' | 'right', T>

    namespace Props {
        interface Sprite {
            position: Position
            velocity?: number
            frames?: Frames
            image: HTMLImageElement
            ctx: CanvasRenderingContext2D
            spirtes?: Partial<Direction>
            animate?: boolean
            heathBarEl?: HTMLProgressElement
            isEnemy?: boolean
            rotate?: number
            name?: string
        }
    }
};

export = Game