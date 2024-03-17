const getMapData = async () => (await fetch('../data/pelletTown.json')).json();

const map = await (getMapData)().then(data => data)

/**
 * collision: 충돌
 * colliding: 충돌하다
 */
const collisions = map.layers.find((v: any) => v.name === 'Collisions')?.data??[] as number[]
const battleZones = map.layers.find((v: any) => v.name === 'Battle Zones')?.data??[] as number[]

export default { collisions, battleZones } as Record<string, number[]>