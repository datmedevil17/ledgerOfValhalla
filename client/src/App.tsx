import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import { Physics, RigidBody, CapsuleCollider, CuboidCollider, interactionGroups } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import { CATALOG, defFor, healthOf, type Age, type Level } from './config'
import { TROOP_DEFS, TROOP_IDS, TROOP_START_COUNT, BAT_SWARM_SIZE, type TroopId } from './troops'
import { DEFENSE_DEFS, TEMPLE_REINFORCE_RADIUS, TEMPLE_REINFORCE_COUNT, TEMPLE_REINFORCE_TYPES } from './defenses'
import { FinalMapCanvas } from './FinalMap'
import { useTxToast, TxToastContainer, TX_TOAST_STYLES } from './TxToast'

// ── Constants ─────────────────────────────────────────────────────────────────
const GRID_W       = 90
const GRID_H       = 72
const OUTER_SIZE   = 1200
const PLACE_RADIUS = 400

// ── Light config ──────────────────────────────────────────────────────────────
interface LightConfig {
  ambient:    { intensity: number; color: string }
  sun:        { intensity: number; color: string; azimuth: number; elevation: number }
  fill:       { intensity: number; color: string }
  hemisphere: { skyColor: string; groundColor: string; intensity: number }
  exposure:   number
}

const DEFAULT_LIGHT: LightConfig = {
  ambient:    { intensity: 0.15, color: '#fff6e0' },
  sun:        { intensity: 1.1,  color: '#f0ebd0', azimuth: 219, elevation: 22 },
  fill:       { intensity: 0.6,  color: '#c0e0ff' },
  hemisphere: { skyColor: '#87ceeb', groundColor: '#5a9e30', intensity: 0.4 },
  exposure:   1.15,
}


const DEFAULT_ENV_ITEMS: PlacedItem[] = [
  {"id":"1779442635027-0.854182506124535","catalogId":"pine-group","path":"/models/Resource_PineTree_Group.gltf","name":"Pine Group","category":"Trees","position":[-45.5,0,-40.5],"rotation":0,"scale":7,"gridW":2,"gridH":2},
  {"id":"1779442640777-0.6557494711340706","catalogId":"pine-group","path":"/models/Resource_PineTree_Group.gltf","name":"Pine Group","category":"Trees","position":[-31.5,0,-40.5],"rotation":0,"scale":7,"gridW":2,"gridH":2},
  {"id":"1779442647544-0.7108071519978292","catalogId":"pine-group","path":"/models/Resource_PineTree_Group.gltf","name":"Pine Group","category":"Trees","position":[-18.5,0,-41.5],"rotation":0,"scale":7,"gridW":2,"gridH":2},
  {"id":"1779442665344-0.7105270790731316","catalogId":"pine-group","path":"/models/Resource_PineTree_Group.gltf","name":"Pine Group","category":"Trees","position":[-5.5,0,-40.5],"rotation":0,"scale":7,"gridW":2,"gridH":2},
  {"id":"1779442671327-0.015435707912457186","catalogId":"pine-group","path":"/models/Resource_PineTree_Group.gltf","name":"Pine Group","category":"Trees","position":[7.5,0,-41.5],"rotation":0,"scale":7,"gridW":2,"gridH":2},
  {"id":"1779442683260-0.8627854621191386","catalogId":"pine-group","path":"/models/Resource_PineTree_Group.gltf","name":"Pine Group","category":"Trees","position":[19.5,0,-41.5],"rotation":0,"scale":7,"gridW":2,"gridH":2},
  {"id":"1779442691877-0.04270197208632287","catalogId":"pine-group","path":"/models/Resource_PineTree_Group.gltf","name":"Pine Group","category":"Trees","position":[32.5,0,-41.5],"rotation":0,"scale":7,"gridW":2,"gridH":2},
  {"id":"1779442705610-0.5552309644294599","catalogId":"pine-group","path":"/models/Resource_PineTree_Group.gltf","name":"Pine Group","category":"Trees","position":[45.5,0,-40.5],"rotation":1.5707963267948966,"scale":7,"gridW":2,"gridH":2},
  {"id":"1779442714611-0.039742673915170945","catalogId":"pine-group","path":"/models/Resource_PineTree_Group.gltf","name":"Pine Group","category":"Trees","position":[48.5,0,-27.5],"rotation":1.5707963267948966,"scale":7,"gridW":2,"gridH":2},
  {"id":"1779442723694-0.017286244256666028","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[44.5,0,-19.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442724910-0.0953819528255131","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[48.5,0,-20.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442726044-0.42755586292209413","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[51.5,0,-17.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442727460-0.253076539832664","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[47.5,0,-16.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442728977-0.6012810159586872","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[43.5,0,-14.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442730027-0.4005770284716562","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[46.5,0,-11.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442731326-0.8397067737280024","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[50.5,0,-11.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442732794-0.7407507300230792","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[54.5,0,-15.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442734910-0.5090272907727907","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[44.5,0,-7.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442736644-0.39513570149773614","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[48.5,0,-8.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442737910-0.762712934548188","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[52.5,0,-7.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442739377-0.33275207898081827","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[54.5,0,-11.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442741860-0.6503102838186577","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[44.5,0,-3.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442743477-0.23147162324585524","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[48.5,0,-4.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442745277-0.7584816309094823","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[52.5,0,-3.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442748694-0.7687416359040907","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[48.5,0,-0.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442750127-0.5177086174106761","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[44.5,0,0.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442752660-0.7525351602363447","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[47.5,0,3.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442754244-0.40258661429495246","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[44.5,0,6.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442755710-0.7977486909657227","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[48.5,0,7.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442757461-0.3531822853843406","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[51.5,0,3.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442758744-0.29423506550637335","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[51.5,0,-0.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442759910-0.36759436489161057","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[54.5,0,0.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442761377-0.5061086288319052","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[54.5,0,-2.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442765011-0.5072271248046687","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[54.5,0,4.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442771877-0.6590041163233337","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[52.5,0,7.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442774111-0.5718917104084844","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[49.5,0,10.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442776560-0.6036383157250358","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[45.5,0,11.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442780410-0.7615907884957038","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[44.5,0,15.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442782478-0.643013134101563","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[47.5,0,14.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442785295-0.9398709354020105","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[47.5,0,18.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442786411-0.6073290601249935","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[51.5,0,15.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442787494-0.9860465147959543","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[51.5,0,12.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442792161-0.753103636677297","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[45.5,0,21.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442793594-0.07049746170534255","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[48.5,0,22.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442794893-0.13812817586769177","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[50.5,0,19.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442816694-0.6671363267196309","catalogId":"pine-group","path":"/models/Resource_PineTree_Group.gltf","name":"Pine Group","category":"Trees","position":[-52.5,0,-27.5],"rotation":0,"scale":7,"gridW":2,"gridH":2},
  {"id":"1779442831460-0.8218999095987305","catalogId":"pine-group","path":"/models/Resource_PineTree_Group.gltf","name":"Pine Group","category":"Trees","position":[-52.5,0,-13.5],"rotation":1.5707963267948966,"scale":7,"gridW":2,"gridH":2},
  {"id":"1779442851345-0.5923498782922116","catalogId":"pine-group","path":"/models/Resource_PineTree_Group.gltf","name":"Pine Group","category":"Trees","position":[-55.5,0,-1.5],"rotation":4.71238898038469,"scale":7,"gridW":2,"gridH":2},
  {"id":"1779442860177-0.7811527630188071","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-47.5,0,2.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442861943-0.139245269324491","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-49.5,0,7.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442863059-0.752522031079171","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-46.5,0,8.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442864260-0.21279168554626526","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-49.5,0,11.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442882593-0.39684127719004947","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-52.5,0,8.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442885144-0.8398873882791629","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-52.5,0,11.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442887727-0.7591523064783519","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-46.5,0,14.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442890693-0.12638199859072718","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-49.5,0,15.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442900993-0.8573105113792301","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-56.5,0,6.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442903860-0.34920323352352844","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-55.5,0,10.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442906427-0.8251779182533755","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-53.5,0,15.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442915727-0.7977840212388613","catalogId":"pine-group","path":"/models/Resource_PineTree_Group.gltf","name":"Pine Group","category":"Trees","position":[-51.5,0,23.5],"rotation":0,"scale":7,"gridW":2,"gridH":2},
  {"id":"1779442922776-0.8845661735581795","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-46.5,0,31.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442924410-0.5785515051977181","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-49.5,0,29.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442925227-0.6238798096465501","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-52.5,0,30.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442927343-0.4556994834081949","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-54.5,0,33.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442929010-0.054597362781673264","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-50.5,0,33.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442931827-0.8111318806774968","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-46.5,0,34.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442947577-0.33592999903336285","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[45.5,0,24.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442949644-0.36570498524184436","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[45.5,0,27.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442952293-0.6843620246156888","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[43.5,0,31.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442953242-0.7711226810796641","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[46.5,0,33.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442954860-0.6731776907849022","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[47.5,0,30.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442956560-0.020694448690731226","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[51.5,0,32.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442958943-0.46700801393113245","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[50.5,0,28.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442960760-0.06870562558148585","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[50.5,0,25.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442962360-0.10090058282452585","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[52.5,0,21.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442963560-0.6951799031671805","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[54.5,0,23.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442965977-0.962778426833171","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[52.5,0,27.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442968127-0.5041082513376406","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[52.5,0,17.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442973627-0.5209288369799452","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[40.5,0,-24.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442975310-0.5272011563835297","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[41.5,0,-10.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442977177-0.7188239701515714","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[40.5,0,-0.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442980794-0.08773969773370893","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[41.5,0,18.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442982277-0.9123502286112892","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[42.5,0,26.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442985176-0.9100271471083471","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-18.5,0,-34.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442987427-0.0013504745379404604","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-38.5,0,-32.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442988793-0.4543273737280914","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-30.5,0,-33.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442991393-0.42461943024243753","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-43.5,0,-31.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779442999344-0.9776335919174935","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[20.5,0,-34.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443140743-0.19842043649777408","catalogId":"mountain-group-b","path":"/models/Mountain_Group_2.gltf","name":"Mountain Group B","category":"Mountains","position":[51.5,0,-57.5],"rotation":0,"scale":9,"gridW":4,"gridH":4},
  {"id":"1779443144310-0.8245365583093194","catalogId":"mountain-group-b","path":"/models/Mountain_Group_2.gltf","name":"Mountain Group B","category":"Mountains","position":[69.5,0,-40.5],"rotation":0,"scale":9,"gridW":4,"gridH":4},
  {"id":"1779443169227-0.423919377464983","catalogId":"mountain-group-a","path":"/models/Mountain_Group_1.gltf","name":"Mountain Group A","category":"Mountains","position":[-73.5,0,-44.5],"rotation":3.141592653589793,"scale":9,"gridW":4,"gridH":4},
  {"id":"1779443176476-0.8497939775228027","catalogId":"mountain-group-a","path":"/models/Mountain_Group_1.gltf","name":"Mountain Group A","category":"Mountains","position":[-38.5,0,-68.5],"rotation":1.5707963267948966,"scale":9,"gridW":4,"gridH":4},
  {"id":"1779443187410-0.7849809859312734","catalogId":"mountain-group-b","path":"/models/Mountain_Group_2.gltf","name":"Mountain Group B","category":"Mountains","position":[-72.5,0,-69.5],"rotation":0,"scale":9,"gridW":4,"gridH":4},
  {"id":"1779443208011-0.9653973572006782","catalogId":"mountain-group-b","path":"/models/Mountain_Group_2.gltf","name":"Mountain Group B","category":"Mountains","position":[-7.5,0,-61.5],"rotation":0,"scale":9,"gridW":4,"gridH":4},
  {"id":"1779443274312-0.0786079177737189","catalogId":"mountain-group-a","path":"/models/Mountain_Group_1.gltf","name":"Mountain Group A","category":"Mountains","position":[29.5,0,-70.5],"rotation":0,"scale":9,"gridW":4,"gridH":4},
  {"id":"1779443281696-0.5886253828399778","catalogId":"mountain-group-a","path":"/models/Mountain_Group_1.gltf","name":"Mountain Group A","category":"Mountains","position":[-3.5,0,-78.5],"rotation":0,"scale":5.5,"gridW":4,"gridH":4},
  {"id":"1779443310246-0.8269858888118771","catalogId":"mountain-large","path":"/models/MountainLarge_Single.gltf","name":"Mountain Large","category":"Mountains","position":[-73.5,0,-23.5],"rotation":0,"scale":8,"gridW":4,"gridH":4},
  {"id":"1779443312462-0.16297830690810622","catalogId":"mountain-large","path":"/models/MountainLarge_Single.gltf","name":"Mountain Large","category":"Mountains","position":[-63.5,0,-19.5],"rotation":0,"scale":8,"gridW":4,"gridH":4},
  {"id":"1779443316762-0.09425742971334405","catalogId":"mountain-single","path":"/models/Mountain_Single.gltf","name":"Mountain","category":"Mountains","position":[-73.5,0,-15.5],"rotation":0,"scale":8,"gridW":3,"gridH":3},
  {"id":"1779443319479-0.2540728093032105","catalogId":"mountain-single","path":"/models/Mountain_Single.gltf","name":"Mountain","category":"Mountains","position":[-85.5,0,-21.5],"rotation":0,"scale":8,"gridW":3,"gridH":3},
  {"id":"1779443354113-0.47389679350184055","catalogId":"mountain-group-b","path":"/models/Mountain_Group_2.gltf","name":"Mountain Group B","category":"Mountains","position":[72.5,0,-71.5],"rotation":0,"scale":9,"gridW":4,"gridH":4},
  {"id":"1779443379912-0.4614137717930147","catalogId":"mountain-group-a","path":"/models/Mountain_Group_1.gltf","name":"Mountain Group A","category":"Mountains","position":[69.5,0,-6.5],"rotation":4.71238898038469,"scale":7,"gridW":4,"gridH":4},
  {"id":"1779443384879-0.8494470560773923","catalogId":"mountain-group-a","path":"/models/Mountain_Group_1.gltf","name":"Mountain Group A","category":"Mountains","position":[-74.5,0,5.5],"rotation":4.71238898038469,"scale":7,"gridW":4,"gridH":4},
  {"id":"1779443408546-0.9499975609667286","catalogId":"mountain-single","path":"/models/Mountain_Single.gltf","name":"Mountain","category":"Mountains","position":[-80.5,0,20.5],"rotation":0,"scale":8,"gridW":3,"gridH":3},
  {"id":"1779443412913-0.11513156137494951","catalogId":"mountain-single","path":"/models/Mountain_Single.gltf","name":"Mountain","category":"Mountains","position":[-89.5,0,29.5],"rotation":0,"scale":8,"gridW":3,"gridH":3},
  {"id":"1779443421663-0.7948868816510918","catalogId":"mountain-large","path":"/models/MountainLarge_Single.gltf","name":"Mountain Large","category":"Mountains","position":[-75.5,0,30.5],"rotation":0,"scale":8,"gridW":4,"gridH":4},
  {"id":"1779443423245-0.8603805735519942","catalogId":"mountain-large","path":"/models/MountainLarge_Single.gltf","name":"Mountain Large","category":"Mountains","position":[-65.5,0,25.5],"rotation":0,"scale":8,"gridW":4,"gridH":4},
  {"id":"1779443430784-0.022774407236833882","catalogId":"mountain-large","path":"/models/MountainLarge_Single.gltf","name":"Mountain Large","category":"Mountains","position":[-68.5,0,32.5],"rotation":0,"scale":4.5,"gridW":4,"gridH":4},
  {"id":"1779443432695-0.6830001594000699","catalogId":"mountain-large","path":"/models/MountainLarge_Single.gltf","name":"Mountain Large","category":"Mountains","position":[-61.5,0,32.5],"rotation":0,"scale":4.5,"gridW":4,"gridH":4},
  {"id":"1779443472612-0.3451067534755571","catalogId":"mountain-group-b","path":"/models/Mountain_Group_2.gltf","name":"Mountain Group B","category":"Mountains","position":[69.5,0,27.5],"rotation":3.141592653589793,"scale":9,"gridW":4,"gridH":4},
  {"id":"1779443480812-0.39124473706768614","catalogId":"mountain-large","path":"/models/MountainLarge_Single.gltf","name":"Mountain Large","category":"Mountains","position":[73.5,0,14.5],"rotation":0,"scale":8,"gridW":4,"gridH":4},
  {"id":"1779443484778-0.6244676462091535","catalogId":"mountain-large","path":"/models/MountainLarge_Single.gltf","name":"Mountain Large","category":"Mountains","position":[82.5,0,-24.5],"rotation":0,"scale":8,"gridW":4,"gridH":4},
  {"id":"1779443486029-0.5237044898983874","catalogId":"mountain-large","path":"/models/MountainLarge_Single.gltf","name":"Mountain Large","category":"Mountains","position":[88.5,0,-3.5],"rotation":0,"scale":8,"gridW":4,"gridH":4},
  {"id":"1779443505678-0.014448884691775077","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[7.5,0,-50.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443506879-0.40975005876499304","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[12.5,0,-50.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443508445-0.19620927282275213","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[17.5,0,-54.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443509730-0.046202407413622915","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[11.5,0,-53.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443511279-0.9419088819687548","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[19.5,0,-51.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443512196-0.09995724731415723","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[23.5,0,-50.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443513145-0.18294108273332343","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[24.5,0,-56.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443514495-0.4113178518527464","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[28.5,0,-52.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443515396-0.11393271995925336","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[31.5,0,-49.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443516728-0.3135014263398852","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[3.5,0,-65.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443517412-0.38351577995757213","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[3.5,0,-71.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443518445-0.27536468981447704","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[6.5,0,-77.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443520513-0.788658163513082","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[27.5,0,-63.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443522578-0.5482734665486017","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-23.5,0,-64.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443524112-0.2990521685971145","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-20.5,0,-62.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443524912-0.589796077178459","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-15.5,0,-66.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443526212-0.8405862906721001","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-18.5,0,-67.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443527728-0.9046862790978571","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-21.5,0,-71.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443529162-0.14659461142998897","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-19.5,0,-76.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443530595-0.6685666733763616","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-23.5,0,-76.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443533462-0.34087354495945477","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-14.5,0,-49.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443534662-0.46048705410071","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-11.5,0,-52.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443537012-0.9651584332012952","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-9.5,0,-48.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443538562-0.742814580808383","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-24.5,0,-49.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443541195-0.0374334572198316","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-50.5,0,-48.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443547895-0.9629137411469474","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-55.5,0,-12.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443567429-0.16528164641126608","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-59.5,0,-9.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443568479-0.1460840355515589","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-63.5,0,-10.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443569762-0.8426412875135699","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-67.5,0,-11.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443571662-0.3198743938794911","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-60.5,0,-13.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443580961-0.20916062239634625","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[57.5,0,-8.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443582445-0.22252231370150932","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[59.5,0,-22.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443583595-0.9839651548304598","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[63.5,0,-29.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443584495-0.8781871266730704","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[64.5,0,-24.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443585495-0.8418598487861152","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[67.5,0,-30.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443586746-0.5084686639451388","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[69.5,0,-25.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443590478-0.7964579445356996","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-58.5,0,29.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443591729-0.6530154906963852","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-58.5,0,24.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443593229-0.044616049814370284","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-61.5,0,20.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443596128-0.6848961616902429","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-58.5,0,17.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443620678-0.06938095818522205","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[57.5,0,8.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443621678-0.20891584477715075","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[59.5,0,12.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443623045-0.827745289290187","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[63.5,0,8.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443623962-0.8490970529920786","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[66.5,0,12.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443626578-0.5869879234541024","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[57.5,0,30.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779443628028-0.46119749892007944","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[54.5,0,34.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779446927238-0.47280856034774277","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-24.5,0,22.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779446928071-0.7479256393249323","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-32.5,0,24.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779446928921-0.6949125489772796","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-34.5,0,7.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779446929521-0.5144616163205217","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-40.5,0,11.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779446930421-0.8960550106810401","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-39.5,0,-0.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779446932621-0.354847238199841","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-17.5,0,-29.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779446933438-0.46181375779459777","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-17.5,0,-24.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779446934721-0.7336296958083711","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-5.5,0,-23.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779446935588-0.19692234768974348","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-12.5,0,-16.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779446937255-0.4310096623343631","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[18.5,0,-29.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779446938154-0.055832640199562356","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[24.5,0,-5.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779446938821-0.32836652462549554","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[14.5,0,-17.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779446939738-0.41096806300880917","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[1.5,0,-17.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779446940621-0.24898541213221648","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[5.5,0,30.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779446941021-0.1180017056261391","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-2.5,0,22.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779446941904-0.05612030522301714","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[-15.5,0,22.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779446942821-0.5896560968610853","catalogId":"pine-tree","path":"/models/Resource_PineTree.gltf","name":"Pine Tree","category":"Trees","position":[24.5,0,20.5],"rotation":0,"scale":8,"gridW":1,"gridH":1},
  {"id":"1779446946755-0.17848414810319613","catalogId":"rock-a","path":"/models/Resource_Rock_1.gltf","name":"Rock A","category":"Rocks","position":[1.5,0,28.5],"rotation":0,"scale":7,"gridW":1,"gridH":1},
  {"id":"1779446948604-0.5956092403867163","catalogId":"rock-a","path":"/models/Resource_Rock_1.gltf","name":"Rock A","category":"Rocks","position":[-26.5,0,-17.5],"rotation":0,"scale":7,"gridW":1,"gridH":1},
  {"id":"1779446949555-0.2097242755946681","catalogId":"rock-a","path":"/models/Resource_Rock_1.gltf","name":"Rock A","category":"Rocks","position":[-40.5,0,-25.5],"rotation":0,"scale":7,"gridW":1,"gridH":1},
  {"id":"1779446951538-0.7247903875255016","catalogId":"rock-a","path":"/models/Resource_Rock_1.gltf","name":"Rock A","category":"Rocks","position":[23.5,0,-12.5],"rotation":0,"scale":7,"gridW":1,"gridH":1},
  {"id":"1779446952855-0.8496099375402135","catalogId":"rock-a","path":"/models/Resource_Rock_1.gltf","name":"Rock A","category":"Rocks","position":[36.5,0,16.5],"rotation":0,"scale":7,"gridW":1,"gridH":1},
  {"id":"1779446957088-0.4564837890809924","catalogId":"rock-b","path":"/models/Resource_Rock_2.gltf","name":"Rock B","category":"Rocks","position":[-8.5,0,23.5],"rotation":0,"scale":7,"gridW":1,"gridH":1},
  {"id":"1779446958588-0.061592264573581024","catalogId":"rock-b","path":"/models/Resource_Rock_2.gltf","name":"Rock B","category":"Rocks","position":[-14.5,0,13.5],"rotation":0,"scale":7,"gridW":1,"gridH":1},
  {"id":"1779446959805-0.5322917295532718","catalogId":"rock-b","path":"/models/Resource_Rock_2.gltf","name":"Rock B","category":"Rocks","position":[22.5,0,4.5],"rotation":0,"scale":7,"gridW":1,"gridH":1},
  {"id":"1779446962871-0.16352259683382542","catalogId":"rock-c","path":"/models/Resource_Rock_3.gltf","name":"Rock C","category":"Rocks","position":[-13.5,0,-7.5],"rotation":0,"scale":7,"gridW":1,"gridH":1},
  {"id":"1779446963804-0.17180460836584588","catalogId":"rock-c","path":"/models/Resource_Rock_3.gltf","name":"Rock C","category":"Rocks","position":[-24.5,0,-8.5],"rotation":0,"scale":7,"gridW":1,"gridH":1},
  {"id":"1779446964854-0.7306788066533572","catalogId":"rock-c","path":"/models/Resource_Rock_3.gltf","name":"Rock C","category":"Rocks","position":[-2.5,0,-21.5],"rotation":0,"scale":7,"gridW":1,"gridH":1},
  {"id":"1779446966772-0.7305936005492463","catalogId":"rock-c","path":"/models/Resource_Rock_3.gltf","name":"Rock C","category":"Rocks","position":[16.5,0,-34.5],"rotation":0,"scale":7,"gridW":1,"gridH":1},
  {"id":"1779446969022-0.6172452999270263","catalogId":"rock-c","path":"/models/Resource_Rock_3.gltf","name":"Rock C","category":"Rocks","position":[33.5,0,5.5],"rotation":0,"scale":7,"gridW":1,"gridH":1}
]
function sunPos(azimuth: number, elevation: number): [number, number, number] {
  const az = (azimuth * Math.PI) / 180
  const el = (elevation * Math.PI) / 180
  const r  = 100
  return [r * Math.cos(el) * Math.sin(az), r * Math.sin(el), r * Math.cos(el) * Math.cos(az)]
}

// ── Catalog ───────────────────────────────────────────────────────────────────
interface CatalogEntry {
  id:           string
  name:         string
  category:     string
  defaultScale: number
  path:         string
  gridW:        number
  gridH:        number
  defId?:       string
}

const ENV_ASSETS: CatalogEntry[] = [
  // Rocks
  { id: 'rock-a',           name: 'Rock A',           category: 'Rocks',     defaultScale: 7,  path: '/models/Resource_Rock_1.gltf',             gridW: 1, gridH: 1 },
  { id: 'rock-b',           name: 'Rock B',           category: 'Rocks',     defaultScale: 7,  path: '/models/Resource_Rock_2.gltf',             gridW: 1, gridH: 1 },
  { id: 'rock-c',           name: 'Rock C',           category: 'Rocks',     defaultScale: 7,  path: '/models/Resource_Rock_3.gltf',             gridW: 1, gridH: 1 },
  { id: 'rock-d',           name: 'Rock',             category: 'Rocks',     defaultScale: 5,  path: '/models/Rock.gltf',                        gridW: 1, gridH: 1 },
  { id: 'rock-group',       name: 'Rock Group',       category: 'Rocks',     defaultScale: 5,  path: '/models/Rock_Group.gltf',                  gridW: 2, gridH: 2 },
  // Resources
  { id: 'mine',             name: 'Mine',             category: 'Resources', defaultScale: 4,  path: '/models/Mine.gltf',                        gridW: 2, gridH: 2 },
  // Structures
  { id: 'port-s1',          name: 'Port',             category: 'Structures',defaultScale: 5,  path: '/models/Port_SecondAge_Level1.gltf',       gridW: 4, gridH: 3 },
]

const BUILDING_ENTRIES: CatalogEntry[] = CATALOG.map(b => ({
  id:           b.id,
  name:         b.name,
  category:     b.category,
  defaultScale: b.scale,
  path:         b.pathFor('SecondAge', 1),
  gridW:        b.grid.w,
  gridH:        b.grid.h,
  defId:        b.id,
}))

const FULL_CATALOG: CatalogEntry[] = [...BUILDING_ENTRIES, ...ENV_ASSETS]
const CATALOG_MAP_FULL = Object.fromEntries(FULL_CATALOG.map(e => [e.id, e]))

// Set of defId values that exist in the current catalog — used to guard healthOf calls
const VALID_DEF_IDS = new Set(CATALOG.map(b => b.id))

const ALL_CATEGORIES = ['Town', 'Military', 'Walls', 'Special', 'Mountains', 'Trees', 'Rocks', 'Resources', 'Props', 'Structures']

// ── Placed item ───────────────────────────────────────────────────────────────
interface PlacedItem {
  id:        string
  catalogId: string
  path:      string
  name:      string
  category:  string
  position:  [number, number, number]
  rotation:  number
  scale:     number
  gridW:     number
  gridH:     number
  defId?:    string
  age?:      Age
  level?:    Level
}

// ── Save / Load ───────────────────────────────────────────────────────────────
interface SaveSlot {
  id:      string
  name:    string
  savedAt: number
  items:   PlacedItem[]
  lights?: LightConfig
}

const STORAGE_KEY  = 'clash-map-v1'
const BASEMAP_KEY  = 'clash-basemap'

function readSaves(): SaveSlot[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function writeSaves(slots: SaveSlot[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slots))
}

interface BasemapState { items: PlacedItem[]; lights: LightConfig }
function readBasemap(): BasemapState | null {
  try { return JSON.parse(localStorage.getItem(BASEMAP_KEY) ?? 'null') } catch { return null }
}
function writeBasemap(state: BasemapState) {
  localStorage.setItem(BASEMAP_KEY, JSON.stringify(state))
}

// ── Troop runtime ─────────────────────────────────────────────────────────────
interface SpawnedTroop {
  uid:     string
  type:    TroopId
  initPos: [number, number, number]
  side:    'attacker' | 'defender'
}

type TroopInventory = Record<TroopId, number>

interface ProjectileState {
  id:       string
  from:     [number, number, number]
  to:       [number, number, number]
  color:    string
  progress: number   // 0 → 1
  duration: number   // flight time in seconds
  visual?:  'sphere' | 'arrow' | 'fireball'
}

// Mutable ref — zero React re-renders for movement / damage
interface GameStateRef {
  buildings:          PlacedItem[]
  buildingHp:         Record<string, number>
  troopHp:            Record<string, number>
  troopTypes:         Record<string, TroopId>
  troopSides:         Record<string, 'attacker' | 'defender'>
  troopPositions:     Record<string, [number, number, number]>
  deadTroops:         Set<string>
  destroyedBuildings: Set<string>
  attackedBuildings:  Set<string>   // buildings hit ≥ once (show HP bar)
  defenseTimers:      Record<string, number>  // building id → cooldown remaining
  templeReinforced:   Set<string>   // temple ids that already released defenders
  projectiles:        ProjectileState[]
}

function buildingCenter(item: PlacedItem): [number, number, number] {
  return [
    item.position[0] + (item.gridW - 1) / 2,
    0,
    item.position[2] + (item.gridH - 1) / 2,
  ]
}

function dist2d(a: [number,number,number], b: [number,number,number]): number {
  return Math.hypot(a[0] - b[0], a[2] - b[2])
}

// Returns true if wallItem lies along the line segment from `from` to `to`
function isWallBlocking(
  wallItem: PlacedItem,
  from: [number,number,number],
  to:   [number,number,number],
): boolean {
  const wc = buildingCenter(wallItem)
  const dx = to[0] - from[0], dz = to[2] - from[2]
  const lenSq = dx * dx + dz * dz
  if (lenSq < 0.001) return false
  const wx = wc[0] - from[0], wz = wc[2] - from[2]
  const t = (wx * dx + wz * dz) / lenSq
  if (t <= 0.05 || t >= 0.95) return false           // not between troop and target
  const perpX = wx - t * dx, perpZ = wz - t * dz
  const threshold = Math.max(wallItem.gridW, wallItem.gridH) * 0.5 + 0.6
  return perpX * perpX + perpZ * perpZ < threshold * threshold
}

// Returns true if (x, z) is enclosed on all 4 sides by living walls
function isInsideWalls(
  x: number, z: number,
  buildings: PlacedItem[],
  buildingHp: Record<string, number>,
): boolean {
  const livingWalls = buildings.filter(b => b.category === 'Walls' && (buildingHp[b.id] ?? 0) > 0)
  if (livingWalls.length === 0) return false

  function wallAt(rx: number, rz: number): boolean {
    return livingWalls.some(w =>
      rx >= w.position[0] && rx < w.position[0] + w.gridW &&
      rz >= w.position[2] && rz < w.position[2] + w.gridH
    )
  }

  function rayBlocked(dx: number, dz: number): boolean {
    let rx = Math.floor(x) + 0.5, rz = Math.floor(z) + 0.5
    for (let step = 0; step < 150; step++) {
      rx += dx; rz += dz
      if (Math.abs(rx) > GRID_W / 2 + 5 || Math.abs(rz) > GRID_H / 2 + 5) return false
      if (wallAt(rx, rz)) return true
    }
    return false
  }

  return rayBlocked(1, 0) && rayBlocked(-1, 0) && rayBlocked(0, 1) && rayBlocked(0, -1)
}

// Returns nearest point on a building's AABB from position (px, pz)
function nearestBuildingPt(px: number, pz: number, b: PlacedItem): [number, number] {
  const bxMin = Math.round(b.position[0] - 0.5)
  const bzMin = Math.round(b.position[2] - 0.5)
  return [
    Math.max(bxMin, Math.min(bxMin + b.gridW, px)),
    Math.max(bzMin, Math.min(bzMin + b.gridH, pz)),
  ]
}

function distToBuilding(px: number, pz: number, b: PlacedItem): number {
  const [nx, nz] = nearestBuildingPt(px, pz, b)
  return Math.hypot(px - nx, pz - nz)
}

// ── Grid helpers ──────────────────────────────────────────────────────────────
// No bounds clamping — placement is allowed across the full canvas
function snapForItem(cx: number, cz: number, w: number, h: number): [number, number, number] {
  return [Math.floor(cx - w / 2) + 0.5, 0, Math.floor(cz - h / 2) + 0.5]
}

function cellKey(cx: number, cz: number) { return `${cx},${cz}` }

function occupiedCells(pos: [number, number, number], w: number, h: number): string[] {
  const bx = Math.round(pos[0] - 0.5), bz = Math.round(pos[2] - 0.5)
  const keys: string[] = []
  for (let dx = 0; dx < w; dx++)
    for (let dz = 0; dz < h; dz++)
      keys.push(cellKey(bx + dx, bz + dz))
  return keys
}

function buildOccupiedSet(items: PlacedItem[]): Set<string> {
  const set = new Set<string>()
  for (const b of items) {
    occupiedCells(b.position, b.gridW, b.gridH).forEach(k => set.add(k))
  }
  return set
}

function hasCollision(pos: [number, number, number], entry: CatalogEntry, occupied: Set<string>): boolean {
  return occupiedCells(pos, entry.gridW, entry.gridH).some(k => occupied.has(k))
}

// ── Textures ──────────────────────────────────────────────────────────────────
function buildGrassTexture(): THREE.CanvasTexture {
  const S = 1024, cv = document.createElement('canvas')
  cv.width = cv.height = S
  const ctx = cv.getContext('2d')!, rng = () => Math.random()
  ctx.fillStyle = '#5cb83d'; ctx.fillRect(0, 0, S, S)
  for (let p = 0; p < 3; p++) {
    const count = [4000, 6000, 9000][p], rMin = [3, 1.5, 0.5][p], rMax = [10, 5, 2][p]
    const lBase = [22, 30, 38][p], lRange = [14, 16, 14][p]
    for (let i = 0; i < count; i++) {
      const rx = rng() * (rMax - rMin) + rMin, ry = rx * (rng() * 1.8 + 0.5)
      ctx.fillStyle = `hsl(${100 + rng() * 30},${40 + rng() * 30}%,${lBase + rng() * lRange}%)`
      ctx.beginPath(); ctx.ellipse(rng() * S, rng() * S, rx, ry, rng() * Math.PI, 0, Math.PI * 2); ctx.fill()
    }
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(6, 6); return tex
}

function buildWildGrassTexture(): THREE.CanvasTexture {
  const S = 1024, cv = document.createElement('canvas')
  cv.width = cv.height = S
  const ctx = cv.getContext('2d')!, rng = () => Math.random()
  ctx.fillStyle = '#3d8520'; ctx.fillRect(0, 0, S, S)
  for (let i = 0; i < 900; i++) {
    const rx = rng() * 24 + 6, ry = rx * (rng() * 0.5 + 0.15)
    ctx.fillStyle = `hsl(${105 + rng() * 25},${30 + rng() * 20}%,${10 + rng() * 8}%)`
    ctx.beginPath(); ctx.ellipse(rng() * S, rng() * S, rx, ry, rng() * Math.PI, 0, Math.PI * 2); ctx.fill()
  }
  for (let i = 0; i < 5000; i++) {
    const rx = rng() * 8 + 1, ry = rx * (rng() * 1.4 + 0.4)
    ctx.fillStyle = `hsl(${95 + rng() * 30},${38 + rng() * 25}%,${20 + rng() * 18}%)`
    ctx.beginPath(); ctx.ellipse(rng() * S, rng() * S, rx, ry, rng() * Math.PI, 0, Math.PI * 2); ctx.fill()
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(20, 20); return tex
}

function buildGridTexture(): THREE.CanvasTexture {
  const PX = 64, cv = document.createElement('canvas')
  cv.width = cv.height = PX
  const ctx = cv.getContext('2d')!
  ctx.clearRect(0, 0, PX, PX)
  ctx.fillStyle = 'rgba(0,24,0,0.07)'; ctx.fillRect(0, 0, PX, PX)
  ctx.strokeStyle = 'rgba(20,70,10,0.6)'; ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(PX - 0.7, 0); ctx.lineTo(PX - 0.7, PX)
  ctx.moveTo(0, PX - 0.7); ctx.lineTo(PX, PX - 0.7)
  ctx.stroke()
  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(GRID_W, GRID_H); return tex
}

// ── Terrain ───────────────────────────────────────────────────────────────────
function OuterTerrain() {
  const tex = useMemo(buildWildGrassTexture, [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[OUTER_SIZE, OUTER_SIZE]} />
      <meshStandardMaterial map={tex} roughness={0.92} metalness={0} />
    </mesh>
  )
}

// Visual grid (no pointer events — PointerPlane handles those)
function GroundPlane() {
  const grass = useMemo(buildGrassTexture, [])
  const grid  = useMemo(buildGridTexture,  [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[GRID_W, GRID_H]} />
        <meshStandardMaterial map={grass} roughness={0.9} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[GRID_W, GRID_H]} />
        <meshBasicMaterial map={grid} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// Large invisible plane — handles both build-mode placement and attack-mode spawning
function PointerPlane({ active, onCursor, onPlace, spawnActive, onSpawn, isPainting }: {
  active:      boolean
  onCursor:    (pos: [number, number] | null) => void
  onPlace:     (x: number, z: number) => void
  spawnActive: boolean
  onSpawn:     (x: number, z: number) => void
  isPainting:  boolean
}) {
  const anyActive  = active || spawnActive
  const isDragging = useRef(false)
  const lastCell   = useRef('')

  function paintCell(x: number, z: number) {
    const key = `${Math.floor(x)},${Math.floor(z)}`
    if (key === lastCell.current) return
    lastCell.current = key
    onPlace(x, z)
  }

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.001, 0]}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        if (!anyActive) return
        e.stopPropagation()
        if (active && isPainting) {
          isDragging.current = true
          lastCell.current = ''
          paintCell(e.point.x, e.point.z)
        }
      }}
      onPointerUp={() => { isDragging.current = false }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!anyActive || isPainting) return
        e.stopPropagation()
        if (active) onPlace(e.point.x, e.point.z)
        else        onSpawn(e.point.x, e.point.z)
      }}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        if (!active) return
        onCursor([e.point.x, e.point.z])
        if (isPainting && isDragging.current) paintCell(e.point.x, e.point.z)
      }}
      onPointerLeave={() => {
        if (active) onCursor(null)
        isDragging.current = false
      }}
    >
      <planeGeometry args={[PLACE_RADIUS, PLACE_RADIUS]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

function GreenBorder() {
  const hw = GRID_W / 2, hh = GRID_H / 2, y = 0.03
  const pts = [[-hw,y,-hh],[hw,y,-hh],[hw,y,hh],[-hw,y,hh],[-hw,y,-hh]]
    .map(([x, _y, z]) => new THREE.Vector3(x, _y, z))
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  return <primitive object={new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#1a4a10', linewidth: 2 }))} />
}

const SEA_START_Z  = GRID_H / 2
const SEA_DEPTH    = OUTER_SIZE / 2 - SEA_START_Z
const SEA_CENTER_Z = SEA_START_Z + SEA_DEPTH / 2

function OceanPlane() {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.opacity = 0.84 + Math.sin(clock.getElapsedTime() * 0.7) * 0.06
  })
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, SEA_CENTER_Z]}>
      <planeGeometry args={[OUTER_SIZE, SEA_DEPTH]} />
      <meshStandardMaterial ref={matRef} color="#2a8fcc" roughness={0.04} metalness={0.45} transparent opacity={0.88} />
    </mesh>
  )
}

function DustMotes() {
  const COUNT = 120, mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const data  = useMemo(() => Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 160, y: Math.random() * 5 + 0.3,
    z: (Math.random() - 0.5) * 160, s: Math.random() * 0.4 + 0.1,
  })), [])
  useFrame(({ clock }) => {
    if (!mesh.current) return
    const t = clock.getElapsedTime()
    data.forEach((d, i) => {
      dummy.position.set(d.x + Math.sin(t * d.s + i) * 0.4, d.y + Math.sin(t * d.s * 1.2 + i) * 0.2, d.z + Math.cos(t * d.s + i) * 0.4)
      dummy.scale.setScalar(0.045 + Math.sin(t + i) * 0.012)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#ffe580" transparent opacity={0.18} />
    </instancedMesh>
  )
}

// ── Scene lights ─────────────────────────────────────────────────────────────
function SceneLights({ cfg }: { cfg: LightConfig }) {
  const pos = sunPos(cfg.sun.azimuth, cfg.sun.elevation)
  return (
    <>
      <ambientLight intensity={cfg.ambient.intensity} color={cfg.ambient.color} />
      <hemisphereLight args={[cfg.hemisphere.skyColor as THREE.ColorRepresentation, cfg.hemisphere.groundColor as THREE.ColorRepresentation, cfg.hemisphere.intensity]} />
      <directionalLight
        position={pos} intensity={cfg.sun.intensity} castShadow color={cfg.sun.color}
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-160} shadow-camera-right={160}
        shadow-camera-top={160}  shadow-camera-bottom={-160}
        shadow-bias={-0.0003}    shadow-normalBias={0.04}
      />
      <directionalLight position={[-30, 50, -20]} intensity={cfg.fill.intensity} color={cfg.fill.color} />
      <directionalLight position={[0, 25, 60]}    intensity={0.25}               color="#ffe8b0" />
    </>
  )
}

const SEP_RADIUS        = 1.0
const MAX_SPHERE_PROJ   = 100

// ── Rapier physics constants ───────────────────────────────────────────────────
// Collision groups (index 0-15)
const GRP_GROUND   = 0
const GRP_BUILDING = 1
const GRP_WALKER   = 2
const GRP_FLYER    = 3

const TROOP_CAPSULE_RADIUS      = 0.4
const TROOP_CAPSULE_HALF_HEIGHT = 0.45
// Distance from body center to foot (halfHeight + radius = 0.85)
const TROOP_GROUND_OFFSET       = TROOP_CAPSULE_HALF_HEIGHT + TROOP_CAPSULE_RADIUS
const TROOP_SPAWN_Y             = TROOP_GROUND_OFFSET   // capsule center so feet land at y=0

function troopFlyY(type: TroopId): number {
  if (type === 'dragon') return 3.0
  if (type === 'ghost')  return 2.5
  return 2.0  // bat
}
const MAX_ARROW_PROJ    = 16
const MAX_FIREBALL_PROJ = 8

// Scratch vectors for projectile orientation (reused each frame, single-threaded JS is safe)
const _projDir  = new THREE.Vector3()
const _arrowFwd = new THREE.Vector3(0, 0, 1)   // arrow long-axis is Z in the model

// ── Troop HP bar ──────────────────────────────────────────────────────────────
function TroopHpBar({ uid, maxHp, gsRef }: {
  uid: string; maxHp: number; gsRef: React.MutableRefObject<GameStateRef>
}) {
  const groupRef = useRef<THREE.Group>(null)
  const fillRef  = useRef<THREE.Mesh>(null)
  useFrame(({ camera }) => {
    if (!groupRef.current || !fillRef.current) return
    // Always face the camera (billboard)
    groupRef.current.quaternion.copy(camera.quaternion)
    const pct = Math.max(0, Math.min(1, (gsRef.current.troopHp[uid] ?? maxHp) / maxHp))
    fillRef.current.scale.x = Math.max(pct, 0.001)
    fillRef.current.position.x = (pct - 1) * 0.5
    const mat = fillRef.current.material as THREE.MeshBasicMaterial
    mat.color.setHSL(pct * 0.33, 1.0, 0.5)
    mat.needsUpdate = true
  })
  return (
    <group ref={groupRef} position={[0, 2.4, 0]}>
      <mesh renderOrder={999}>
        <planeGeometry args={[1.0, 0.13]} />
        <meshBasicMaterial color="#111" transparent opacity={0.8} depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={fillRef} position={[0, 0, 0.003]} renderOrder={1000}>
        <planeGeometry args={[1.0, 0.09]} />
        <meshBasicMaterial color="#00ff00" depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ── Building HP bar — only visible after first hit, bright green → red ────────
function BuildingHpBar({ item, maxHp, gsRef }: {
  item: PlacedItem; maxHp: number; gsRef: React.MutableRefObject<GameStateRef>
}) {
  const groupRef = useRef<THREE.Group>(null)
  const fillRef  = useRef<THREE.Mesh>(null)
  useFrame(({ camera }) => {
    if (!groupRef.current || !fillRef.current) return
    const attacked = gsRef.current.attackedBuildings.has(item.id)
    groupRef.current.visible = attacked
    if (!attacked) return
    // Always face the camera (billboard)
    groupRef.current.quaternion.copy(camera.quaternion)
    const pct = Math.max(0, Math.min(1, (gsRef.current.buildingHp[item.id] ?? maxHp) / maxHp))
    fillRef.current.scale.x = Math.max(pct, 0.001)
    fillRef.current.position.x = (pct - 1) * 1.1
    const mat = fillRef.current.material as THREE.MeshBasicMaterial
    mat.color.setHSL(pct * 0.33, 1.0, 0.5)
    mat.needsUpdate = true
  })
  const cx = item.position[0] + (item.gridW - 1) / 2
  const cz = item.position[2] + (item.gridH - 1) / 2
  return (
    <group ref={groupRef} position={[cx, 7.5, cz]} visible={false}>
      <mesh renderOrder={999}>
        <planeGeometry args={[2.2, 0.28]} />
        <meshBasicMaterial color="#111" transparent opacity={0.82} depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={fillRef} position={[0, 0, 0.003]} renderOrder={1000}>
        <planeGeometry args={[2.2, 0.2]} />
        <meshBasicMaterial color="#00ff44" depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ── Projectile renderer — typed pools: spheres, arrows (GLTF), fireballs (GLTF) ─
function ProjectileRenderer({ gsRef }: { gsRef: React.MutableRefObject<GameStateRef> }) {
  const sphereSlots   = useRef<(THREE.Mesh  | null)[]>([])
  const arrowSlots    = useRef<(THREE.Group | null)[]>([])
  const fireballSlots = useRef<(THREE.Group | null)[]>([])

  const { scene: arrowScene }    = useGLTF('/arrow.glb')
  const { scene: fireballScene } = useGLTF('/fireball.glb')

  const arrowClones = useMemo(() =>
    Array.from({ length: MAX_ARROW_PROJ }, () => arrowScene.clone(true)),
  [arrowScene])

  const fireballClones = useMemo(() =>
    Array.from({ length: MAX_FIREBALL_PROJ }, () => {
      const c = fireballScene.clone(true)
      c.traverse(o => {
        const m = o as THREE.Mesh
        if (!m.isMesh) return
        const applyGlow = (mat: THREE.Material) => {
          const nm = (mat as THREE.MeshStandardMaterial).clone()
          nm.emissive = new THREE.Color('#ff4400')
          nm.emissiveIntensity = 3.0
          return nm
        }
        m.material = Array.isArray(m.material) ? m.material.map(applyGlow) : applyGlow(m.material)
      })
      return c
    }),
  [fireballScene])

  useFrame((_, delta) => {
    const gs = gsRef.current
    gs.projectiles = gs.projectiles.filter(p => { p.progress += delta / p.duration; return p.progress < 1 })

    const sphereProjs   = gs.projectiles.filter(p => !p.visual || p.visual === 'sphere')
    const arrowProjs    = gs.projectiles.filter(p => p.visual === 'arrow')
    const fireballProjs = gs.projectiles.filter(p => p.visual === 'fireball')

    for (let i = 0; i < MAX_SPHERE_PROJ; i++) {
      const mesh = sphereSlots.current[i]
      if (!mesh) continue
      const p = sphereProjs[i]
      if (p) {
        const t = p.progress
        mesh.position.set(
          p.from[0] + (p.to[0] - p.from[0]) * t,
          p.from[1] + (p.to[1] - p.from[1]) * t + Math.sin(t * Math.PI) * 2.5,
          p.from[2] + (p.to[2] - p.from[2]) * t,
        )
        mesh.visible = true
        ;(mesh.material as THREE.MeshBasicMaterial).color.set(p.color)
      } else {
        mesh.visible = false
      }
    }

    for (let i = 0; i < MAX_ARROW_PROJ; i++) {
      const group = arrowSlots.current[i]
      if (!group) continue
      const p = arrowProjs[i]
      if (p) {
        const t  = p.progress
        const t2 = Math.min(1, t + 0.01)
        const fx = p.from[0], fy = p.from[1], fz = p.from[2]
        const tx = p.to[0],   ty = p.to[1],   tz = p.to[2]
        const px1 = fx + (tx - fx) * t,  py1 = fy + (ty - fy) * t  + Math.sin(t  * Math.PI) * 2.5, pz1 = fz + (tz - fz) * t
        const px2 = fx + (tx - fx) * t2, py2 = fy + (ty - fy) * t2 + Math.sin(t2 * Math.PI) * 2.5, pz2 = fz + (tz - fz) * t2
        group.position.set(px1, py1, pz1)
        _projDir.set(px2 - px1, py2 - py1, pz2 - pz1)
        if (_projDir.lengthSq() > 0.0001) {
          _projDir.normalize()
          group.quaternion.setFromUnitVectors(_arrowFwd, _projDir)
        }
        group.visible = true
      } else {
        group.visible = false
      }
    }

    for (let i = 0; i < MAX_FIREBALL_PROJ; i++) {
      const group = fireballSlots.current[i]
      if (!group) continue
      const p = fireballProjs[i]
      if (p) {
        const t = p.progress
        group.position.set(
          p.from[0] + (p.to[0] - p.from[0]) * t,
          p.from[1] + (p.to[1] - p.from[1]) * t + Math.sin(t * Math.PI) * 2.5,
          p.from[2] + (p.to[2] - p.from[2]) * t,
        )
        group.visible = true
      } else {
        group.visible = false
      }
    }
  })

  return (
    <>
      {Array.from({ length: MAX_SPHERE_PROJ }, (_, i) => (
        <mesh key={`sp${i}`} ref={el => { sphereSlots.current[i] = el }} renderOrder={500} visible={false}>
          <sphereGeometry args={[0.28, 8, 6]} />
          <meshBasicMaterial color="white" depthTest={false} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      {arrowClones.map((clone, i) => (
        <group key={`ar${i}`} ref={el => { arrowSlots.current[i] = el }} visible={false} scale={0.7}>
          <primitive object={clone} />
        </group>
      ))}
      {fireballClones.map((clone, i) => (
        <group key={`fb${i}`} ref={el => { fireballSlots.current[i] = el }} visible={false} scale={0.55}>
          <primitive object={clone} />
        </group>
      ))}
    </>
  )
}

// ── Defense system (building AI + temple reinforcements — runs in Canvas) ─────
function DefenseSystem({ gsRef, onSpawnDefender }: {
  gsRef:           React.MutableRefObject<GameStateRef>
  onSpawnDefender: (pos: [number,number,number], type: TroopId) => void
}) {
  useFrame((_, delta) => {
    const gs = gsRef.current
    const attackers = Object.entries(gs.troopPositions).filter(
      ([uid]) => gs.troopSides[uid] === 'attacker' && !gs.deadTroops.has(uid) && (gs.troopHp[uid] ?? 0) > 0
    )
    if (attackers.length === 0) return

    for (const building of gs.buildings) {
      if ((gs.buildingHp[building.id] ?? 0) <= 0) continue
      const bc = buildingCenter(building)

      // ── Temple reinforcements ──────────────────────────────────────────────
      if (building.defId === 'temple' && !gs.templeReinforced.has(building.id)) {
        // Trigger when first attacked OR when any attacker enters the radius
        const triggered =
          gs.attackedBuildings.has(building.id) ||
          attackers.some(([, pos]) => dist2d(pos as [number,number,number], bc) < TEMPLE_REINFORCE_RADIUS)
        if (triggered) {
          gs.templeReinforced.add(building.id)
          for (let i = 0; i < TEMPLE_REINFORCE_COUNT; i++) {
            const angle = (i / TEMPLE_REINFORCE_COUNT) * Math.PI * 2
            onSpawnDefender(
              [bc[0] + Math.cos(angle) * 1.0, 0, bc[2] + Math.sin(angle) * 1.0],
              TEMPLE_REINFORCE_TYPES[i] as TroopId,
            )
          }
        }
      }

      // ── Defensive attack ───────────────────────────────────────────────────
      const def = DEFENSE_DEFS[building.defId ?? '']
      if (!def) continue

      // Find nearest attacker in range
      let nearUid: string | null = null, nearPos: [number,number,number] | null = null, nearDist = Infinity
      for (const [uid, pos] of attackers) {
        const d = dist2d(pos, bc)
        if (d < nearDist) { nearUid = uid; nearPos = pos as [number,number,number]; nearDist = d }
      }
      if (!nearUid || !nearPos || nearDist > def.attackRange) continue

      gs.defenseTimers[building.id] = (gs.defenseTimers[building.id] ?? 0) - delta
      if (gs.defenseTimers[building.id] > 0) continue
      gs.defenseTimers[building.id] = def.attackCooldown

      // Damage the troop
      gs.troopHp[nearUid] = Math.max(0, (gs.troopHp[nearUid] ?? 0) - def.attackDamage)

      // Launch projectile for ranged defenses
      if (def.isRanged) {
        gs.projectiles.push({
          id: `${Date.now()}-${Math.random()}`,
          from: [bc[0], 4, bc[2]],
          to:   [nearPos[0], (nearPos[1] ?? 0) + 0.5, nearPos[2]],
          color: def.projColor,
          progress: 0,
          duration: Math.max(0.2, nearDist * 0.04),
          visual: def.projVisual,
        })
      }
    }
  })
  return null
}

// ── Building colliders (fixed physics bodies for walkers to collide with) ─────
function BuildingColliders({ buildings, destroyedIds }: {
  buildings:    PlacedItem[]
  destroyedIds: string[]
}) {
  const destroyedSet = useMemo(() => new Set(destroyedIds), [destroyedIds])
  return (
    <>
      {buildings.filter(b => !destroyedSet.has(b.id)).map(b => {
        const cx = b.position[0] + (b.gridW - 1) / 2
        const cz = b.position[2] + (b.gridH - 1) / 2
        return (
          <RigidBody key={b.id} type="fixed" position={[cx, 0, cz]} colliders={false}>
            <CuboidCollider
              args={[b.gridW / 2, 2, b.gridH / 2]}
              collisionGroups={interactionGroups([GRP_BUILDING], [GRP_WALKER])}
            />
          </RigidBody>
        )
      })}
    </>
  )
}

const ENV_OBSTACLE_CATEGORIES = new Set(['Trees', 'Rocks', 'Mountains'])

// ── Environment colliders (trees, rocks, mountains block walkers) ─────────────
function EnvColliders({ items }: { items: PlacedItem[] }) {
  const obstacles = useMemo(
    () => items.filter(it => ENV_OBSTACLE_CATEGORIES.has(it.category)),
    [items]
  )
  return (
    <>
      {obstacles.map(it => {
        const cx = it.position[0] + (it.gridW - 1) / 2
        const cz = it.position[2] + (it.gridH - 1) / 2
        return (
          <RigidBody key={it.id} type="fixed" position={[cx, 0, cz]} colliders={false}>
            <CuboidCollider
              args={[it.gridW / 2, 2, it.gridH / 2]}
              collisionGroups={interactionGroups([GRP_BUILDING], [GRP_WALKER])}
            />
          </RigidBody>
        )
      })}
    </>
  )
}

// ── Animated troop ────────────────────────────────────────────────────────────
function AnimatedTroop({ troop, gsRef, onDied }: {
  troop:  SpawnedTroop
  gsRef:  React.MutableRefObject<GameStateRef>
  onDied: (uid: string) => void
}) {
  const def      = TROOP_DEFS[troop.type]
  const isFlying = def.isFlying === true
  const isRanged = !!def.minRange && !isFlying
  const flyY     = troopFlyY(troop.type)

  const { scene, animations } = useGLTF(def.path)
  const bodyRef   = useRef<RapierRigidBody>(null)
  const facingRef = useRef<THREE.Group>(null)   // inner group for model + animations
  const attackTmr = useRef(0)
  const curAnim   = useRef('')
  const deadDone  = useRef(false)

  const clone = useMemo(() => {
    const c = SkeletonUtils.clone(scene) as THREE.Group
    c.traverse(o => { if ((o as THREE.Mesh).isMesh) { o.castShadow = o.receiveShadow = true } })
    return c
  }, [scene])

  const { actions } = useAnimations(animations, facingRef)

  function play(name: string, once = false, syncDuration?: number) {
    if (curAnim.current === name || !actions[name]) return
    actions[curAnim.current]?.fadeOut(0.18)
    const a = actions[name]!.reset().fadeIn(0.18).play()
    if (once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true }
    if (syncDuration !== undefined) {
      const dur = a.getClip().duration
      if (dur > 0) a.timeScale = dur / syncDuration
    }
    curAnim.current = name
  }

  useEffect(() => {
    const t = setTimeout(() => play(def.anim.idle), 80)
    return () => clearTimeout(t)
  }, [actions]) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    const gs     = gsRef.current
    const body   = bodyRef.current
    const facing = facingRef.current
    if (!body || !facing || deadDone.current) return

    const p  = body.translation()
    const px = p.x, py = p.y, pz = p.z

    let velX = 0, velY = 0, velZ = 0

    // Flying altitude spring
    if (isFlying) velY = (flyY - py) * 10

    const myHp = gs.troopHp[troop.uid] ?? def.maxHp
    if (myHp <= 0) {
      deadDone.current = true
      body.setEnabled(false)
      play(def.anim.death, true)
      setTimeout(() => onDied(troop.uid), 2500)
      return
    }

    // ── Separation — flying↔flying only, ground↔ground only ─────────────────
    let sx = 0, sz = 0
    for (const [uid, oPos] of Object.entries(gs.troopPositions)) {
      if (uid === troop.uid) continue
      const otherDef = gs.troopTypes[uid] ? TROOP_DEFS[gs.troopTypes[uid]] : null
      if (!otherDef || !!otherDef.isFlying !== isFlying) continue
      const ox = px - oPos[0], oz = pz - oPos[2]
      const od = Math.hypot(ox, oz)
      if (od > 0 && od < SEP_RADIUS) {
        const str = (SEP_RADIUS - od) / SEP_RADIUS
        sx += (ox / od) * str; sz += (oz / od) * str
      }
    }
    if (sx !== 0 || sz !== 0) {
      const sl = Math.max(Math.hypot(sx, sz), 0.001)
      velX += (sx / sl) * 2.0
      velZ += (sz / sl) * 2.0
    }

    // ── Defender AI ──────────────────────────────────────────────────────────
    if (troop.side === 'defender') {
      const enemies = Object.entries(gs.troopPositions).filter(
        ([uid]) => gs.troopSides[uid] === 'attacker' && !gs.deadTroops.has(uid) && (gs.troopHp[uid] ?? 0) > 0
      )
      if (enemies.length === 0) {
        play(def.anim.idle)
      } else {
        let eid = enemies[0][0], epos = enemies[0][1] as [number,number,number], edist = Infinity
        for (const [uid, pos] of enemies) {
          const d = dist2d([px, 0, pz], pos as [number,number,number])
          if (d < edist) { eid = uid; epos = pos as [number,number,number]; edist = d }
        }
        const dx = epos[0] - px, dz = epos[2] - pz
        if (edist > 2) {
          velX += (dx / Math.max(edist, 0.001)) * def.speed
          velZ += (dz / Math.max(edist, 0.001)) * def.speed
          facing.rotation.y = Math.atan2(dx, dz)
          play(def.anim.run)
          attackTmr.current = def.attackCooldown * 0.4
        } else {
          facing.rotation.y = Math.atan2(dx, dz)
          play(def.anim.attack, false, def.attackCooldown)
          attackTmr.current -= delta
          if (attackTmr.current <= 0) {
            attackTmr.current = def.attackCooldown
            gs.troopHp[eid] = Math.max(0, (gs.troopHp[eid] ?? 0) - def.attackDamage)
          }
        }
      }
      body.setLinvel({ x: velX, y: velY, z: velZ }, true)
      gs.troopPositions[troop.uid] = [px, py, pz]
      return
    }

    // ── Attacker AI ──────────────────────────────────────────────────────────
    const living = gs.buildings.filter(b => b.defId && (gs.buildingHp[b.id] ?? 0) > 0)
    if (living.length === 0) {
      play(def.anim.idle)
      body.setLinvel({ x: 0, y: velY, z: 0 }, true)
      gs.troopPositions[troop.uid] = [px, py, pz]
      return
    }

    const myPos: [number,number,number] = [px, py, pz]
    const innerBuildings = living.filter(b => b.category !== 'Walls')
    const aliveWalls     = living.filter(b => b.category === 'Walls')

    const defenseBuildings  = innerBuildings.filter(b => !!DEFENSE_DEFS[b.defId ?? ''])
    const resourceBuildings = innerBuildings.filter(b => !DEFENSE_DEFS[b.defId ?? ''])
    const preferredPool =
      (isFlying || isRanged)
        ? (defenseBuildings.length > 0 ? defenseBuildings : resourceBuildings.length > 0 ? resourceBuildings : aliveWalls)
        : (resourceBuildings.length > 0 ? resourceBuildings : defenseBuildings.length > 0 ? defenseBuildings : aliveWalls)

    // Select nearest building by EDGE distance (not center) — large buildings are correctly prioritised
    let nearestBuilding = preferredPool[0], nearestBDist = Infinity
    for (const b of preferredPool) {
      const d = distToBuilding(px, pz, b)
      if (d < nearestBDist) { nearestBuilding = b; nearestBDist = d }
    }

    // Wall blocking — melee ground troops only
    let target = nearestBuilding
    if (!isFlying && !isRanged && aliveWalls.length > 0 && innerBuildings.length > 0) {
      const tbc = buildingCenter(nearestBuilding)
      let blockWall: PlacedItem | null = null, blockDist = Infinity
      for (const w of aliveWalls) {
        if (!isWallBlocking(w, myPos, tbc)) continue
        const d = distToBuilding(px, pz, w)
        if (d < blockDist) { blockWall = w; blockDist = d }
      }
      if (blockWall) target = blockWall
    }

    const bc           = buildingCenter(target)           // used for projectile visuals
    const [nearX, nearZ] = nearestBuildingPt(px, pz, target)  // nearest edge point
    const dx  = nearX - px, dz = nearZ - pz
    const dst = Math.hypot(dx, dz)  // distance to building EDGE, not center

    if (dst > def.attackRange) {
      velX += (dx / Math.max(dst, 0.001)) * def.speed
      velZ += (dz / Math.max(dst, 0.001)) * def.speed
      facing.rotation.y = Math.atan2(dx, dz)
      play(def.anim.run)
      attackTmr.current = def.attackCooldown * 0.4
    } else {
      // Ranged: back away if too close
      if (def.minRange && dst < def.minRange && dst > 0.1) {
        velX -= (dx / Math.max(dst, 0.001)) * def.speed
        velZ -= (dz / Math.max(dst, 0.001)) * def.speed
      }
      // Face the building center for a more natural look when attacking
      const cdx = bc[0] - px, cdz = bc[2] - pz
      facing.rotation.y = Math.atan2(cdx, cdz)
      play(def.anim.attack, false, def.attackCooldown)
      attackTmr.current -= delta
      if (attackTmr.current <= 0) {
        attackTmr.current = def.attackCooldown

        gs.attackedBuildings.add(target.id)
        gs.buildingHp[target.id] = Math.max(0, (gs.buildingHp[target.id] ?? 0) - def.attackDamage)
        if (gs.buildingHp[target.id] <= 0) gs.destroyedBuildings.add(target.id)

        // AoE splash
        if (def.splashRadius) {
          for (const b of living) {
            if (b.id === target.id) continue
            if (dist2d(buildingCenter(b), bc) <= def.splashRadius) {
              gs.attackedBuildings.add(b.id)
              gs.buildingHp[b.id] = Math.max(0, (gs.buildingHp[b.id] ?? 0) - def.attackDamage * 0.5)
              if (gs.buildingHp[b.id] <= 0) gs.destroyedBuildings.add(b.id)
            }
          }
        }

        // Cleric heals lowest-HP ally
        if (def.healRadius && def.healAmount) {
          let bestUid: string | null = null, bestHp = Infinity
          for (const [uid, hp] of Object.entries(gs.troopHp)) {
            if (uid === troop.uid || gs.deadTroops.has(uid) || hp <= 0) continue
            const tPos = gs.troopPositions[uid]
            if (tPos && dist2d([px, 0, pz], tPos) <= def.healRadius && hp < bestHp) {
              bestUid = uid; bestHp = hp
            }
          }
          if (bestUid) {
            gs.troopHp[bestUid] = Math.min(
              TROOP_DEFS[gs.troopTypes[bestUid]].maxHp,
              (gs.troopHp[bestUid] ?? 0) + def.healAmount,
            )
          }
        }

        // Projectile — y from actual physics position
        if (def.projColor) {
          const visual = troop.type === 'ranger' ? 'arrow'
                       : troop.type === 'dragon' ? 'fireball'
                       : 'sphere'
          gs.projectiles.push({
            id: `${Date.now()}-${Math.random()}`,
            from: [px, py + 0.5, pz],
            to:   [bc[0], 2, bc[2]],
            color: def.projColor,
            progress: 0,
            duration: Math.max(0.25, Math.max(dst, 1) * 0.04),
            visual,
          })
        }
      }
    }

    // Position correction — setLinvel overrides Rapier collision response every frame,
    // so we manually eject walkers from any building they overlap.
    if (!isFlying) {
      const PUSH_R = TROOP_CAPSULE_RADIUS + 0.15   // slightly larger margin for fast troops
      let corrX = px, corrZ = pz
      for (const b of gs.buildings) {
        if ((gs.buildingHp[b.id] ?? 0) <= 0) continue
        const bxMin = Math.round(b.position[0] - 0.5)
        const bzMin = Math.round(b.position[2] - 0.5)
        const bxMax = bxMin + b.gridW
        const bzMax = bzMin + b.gridH
        const closestX = Math.max(bxMin, Math.min(bxMax, corrX))
        const closestZ = Math.max(bzMin, Math.min(bzMax, corrZ))
        const pdx = corrX - closestX, pdz = corrZ - closestZ
        const pd  = Math.hypot(pdx, pdz)
        if (pd < PUSH_R) {
          if (pd > 0.001) {
            // Outside but too close — push away from surface
            corrX += (pdx / pd) * (PUSH_R - pd)
            corrZ += (pdz / pd) * (PUSH_R - pd)
          } else {
            // Inside (or exactly on surface) — escape via shortest axis to building center
            const bcx = (bxMin + bxMax) * 0.5, bcz = (bzMin + bzMax) * 0.5
            const ex = corrX - bcx, ez = corrZ - bcz
            const el = Math.hypot(ex, ez)
            if (el > 0.001) {
              corrX = bcx + (ex / el) * (b.gridW * 0.5 + PUSH_R)
              corrZ = bcz + (ez / el) * (b.gridH * 0.5 + PUSH_R)
            } else {
              corrX = bxMax + PUSH_R  // degenerate: push in +X
            }
          }
        }
      }
      if (corrX !== px || corrZ !== pz) {
        body.setTranslation({ x: corrX, y: py, z: corrZ }, true)
      }
    }

    body.setLinvel({ x: velX, y: velY, z: velZ }, true)
    gs.troopPositions[troop.uid] = [px, py, pz]
  })

  return (
    <RigidBody
      ref={bodyRef}
      type="dynamic"
      position={troop.initPos}
      linearDamping={8}
      angularDamping={1000}
      enabledRotations={[false, false, false]}
      gravityScale={isFlying ? 0 : 1}
      colliders={false}
    >
      {isFlying ? (
        <CapsuleCollider
          args={[TROOP_CAPSULE_HALF_HEIGHT, TROOP_CAPSULE_RADIUS]}
          collisionGroups={interactionGroups([GRP_FLYER], [GRP_FLYER])}
        />
      ) : (
        <CapsuleCollider
          args={[TROOP_CAPSULE_HALF_HEIGHT, TROOP_CAPSULE_RADIUS]}
          collisionGroups={interactionGroups([GRP_WALKER], [GRP_GROUND, GRP_BUILDING, GRP_WALKER])}
        />
      )}
      <group ref={facingRef} position={[0, -TROOP_GROUND_OFFSET, 0]}>
        <primitive object={clone} scale={def.renderScale} />
        <TroopHpBar uid={troop.uid} maxHp={def.maxHp} gsRef={gsRef} />
      </group>
    </RigidBody>
  )
}

// ── 3D model helpers ──────────────────────────────────────────────────────────
function Model({ path, position, rotation = [0, 0, 0], scale = 1, onClick }: {
  path:      string
  position:  [number, number, number]
  rotation?: [number, number, number]
  scale?:    number
  onClick?:  (e: ThreeEvent<MouseEvent>) => void
}) {
  const { scene } = useGLTF(path)
  const clone = useMemo(() => {
    const c = scene.clone(true)
    c.traverse(o => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow    = true
        o.receiveShadow = true
      }
    })
    return c
  }, [scene])
  return <primitive object={clone} position={position} rotation={rotation} scale={scale} onClick={onClick} />
}

function GhostItem({ path, position, rotation, scale, w, h, valid }: {
  path: string; position: [number, number, number]
  rotation: number; scale: number; w: number; h: number; valid: boolean
}) {
  const { scene } = useGLTF(path)
  const clone = useMemo(() => {
    const c = scene.clone(true)
    c.traverse(o => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      const tint = (mat: THREE.Material) => {
        const n = (mat as THREE.MeshStandardMaterial).clone()
        n.transparent = true; n.opacity = 0.55
        n.emissive = new THREE.Color(valid ? '#44ff44' : '#ff2200')
        n.emissiveIntensity = 0.35
        return n
      }
      m.material = Array.isArray(m.material) ? m.material.map(tint) : tint(m.material)
    })
    return c
  }, [scene, valid])

  const rotated = Math.abs(Math.sin(rotation)) > 0.5
  const ew = rotated ? h : w
  const eh = rotated ? w : h
  const fx = position[0] + (ew - 1) / 2
  const fz = position[2] + (eh - 1) / 2

  return (
    <group>
      <primitive object={clone} position={position} rotation={[0, rotation, 0]} scale={scale} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[fx, 0.02, fz]}>
        <planeGeometry args={[ew, eh]} />
        <meshBasicMaterial color={valid ? '#00ff44' : '#ff2200'} transparent opacity={valid ? 0.2 : 0.32} depthWrite={false} />
      </mesh>
    </group>
  )
}

function PlacedItems({ items, selectedId, canSelect, onSelect }: {
  items:      PlacedItem[]
  selectedId: string | null
  canSelect:  boolean
  onSelect:   (id: string) => void
}) {
  return (
    <>
      {items.map(item => {
        const isSelected = item.id === selectedId
        const cat = CATALOG_MAP_FULL[item.catalogId]
        const rawW = cat?.gridW ?? item.gridW
        const rawH = cat?.gridH ?? item.gridH
        const rotated = Math.abs(Math.sin(item.rotation)) > 0.5
        const ew = rotated ? rawH : rawW
        const eh = rotated ? rawW : rawH
        const fx = item.position[0] + (ew - 1) / 2
        const fz = item.position[2] + (eh - 1) / 2
        return (
          <Suspense key={item.id} fallback={null}>
            <group>
              <Model
                path={item.path}
                position={item.position}
                rotation={[0, item.rotation, 0]}
                scale={item.scale}
                onClick={canSelect ? e => { e.stopPropagation(); onSelect(item.id) } : undefined}
              />
              {isSelected && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[fx, 0.05, fz]}>
                  <planeGeometry args={[ew + 0.3, eh + 0.3]} />
                  <meshBasicMaterial color="#f0c040" transparent opacity={0.35} depthWrite={false} side={THREE.DoubleSide} />
                </mesh>
              )}
            </group>
          </Suspense>
        )
      })}
    </>
  )
}

// ── Camera ────────────────────────────────────────────────────────────────────
function CameraSetup() {
  const { camera } = useThree()
  useEffect(() => { camera.lookAt(0, 0, 0) }, [camera])
  return null
}

// ── Preloads ──────────────────────────────────────────────────────────────────
FULL_CATALOG.forEach(e => useGLTF.preload(e.path))
CATALOG.forEach(b => {
  ([1, 2, 3] as Level[]).filter(lv => lv <= (b.maxLevel ?? 3)).forEach(lv => useGLTF.preload(b.pathFor('SecondAge', lv)))
})
TROOP_IDS.forEach(id => useGLTF.preload(TROOP_DEFS[id].path))
useGLTF.preload('/arrow.glb')
useGLTF.preload('/fireball.glb')

// ── UI helpers ────────────────────────────────────────────────────────────────
const PANEL_W = 260

const btn: CSSProperties = {
  padding: '6px 10px', background: '#1e1206', border: '1px solid #6a4820',
  borderRadius: 4, color: '#d8c090', cursor: 'pointer', fontSize: 12,
  fontFamily: 'inherit',
}

// ── Market cards ──────────────────────────────────────────────────────────────
const CARD_BASE = '/spells/Renders/'

const MARKET_CARDS = [
  '0_CardBack','1_Fireball','4_Market',
  '5_Steal','8_LightningWizard','14_Coin',
  '17_Rebirth','18_WaterDragon','20_Element_Fire','21_Element_Lightning',
  '22_Element_Air','23_Element_Water','24_Element_Dark','25_Element_Earth',
  '26_BloodRing','29_Block','30_Wizard',
].map(f => ({
  src:  `${CARD_BASE}${f}.png`,
  name: f.replace(/^\d+_/, '').replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2'),
}))

function MarketDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(820px, 92vw)', maxHeight: '88vh',
          background: 'rgba(10,5,0,0.97)', border: '2px solid #6a4820',
          borderRadius: 10, display: 'flex', flexDirection: 'column',
          fontFamily: "'Segoe UI', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{
          padding: '12px 18px', borderBottom: '1px solid #4a2e08',
          display: 'flex', alignItems: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f0c040', letterSpacing: 1.4, flex: 1 }}>
            🏪 MARKET
          </span>
          <span style={{ fontSize: 11, color: '#6a4820', marginRight: 14 }}>
            {MARKET_CARDS.length} cards
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#907050',
            cursor: 'pointer', fontSize: 18, lineHeight: 1,
          }}>✕</button>
        </div>

        {/* Card grid */}
        <div style={{
          overflowY: 'auto', padding: 16,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12,
        }}>
          {MARKET_CARDS.map(card => (
            <div
              key={card.src}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
            >
              <div style={{
                borderRadius: 8, overflow: 'hidden', border: '1px solid #3a2008',
                background: '#0e0800',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.07)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 18px rgba(240,192,64,0.25)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = ''
                  ;(e.currentTarget as HTMLElement).style.boxShadow = ''
                }}
              >
                <img
                  src={card.src}
                  alt={card.name}
                  style={{ width: '100%', display: 'block' }}
                  loading="lazy"
                />
              </div>
              <span style={{ fontSize: 9, color: '#9a7040', textAlign: 'center', lineHeight: 1.3 }}>
                {card.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScaleControl({ value, onChange, min = 0.5, max = 20 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="range" min={min} max={max} step={0.5} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: '#f0c040' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button style={{ ...btn, padding: '2px 7px', fontSize: 14 }}
          onClick={() => onChange(Math.max(min, value - 0.5))}>−</button>
        <span style={{ color: '#f0c040', fontSize: 12, fontWeight: 700, minWidth: 36, textAlign: 'center' }}>
          ×{value.toFixed(1)}
        </span>
        <button style={{ ...btn, padding: '2px 7px', fontSize: 14 }}
          onClick={() => onChange(Math.min(max, value + 0.5))}>+</button>
      </div>
    </div>
  )
}

const expandedCats = new Set<string>(ALL_CATEGORIES)

function CatalogPanel({ selectedId, placementScale, rotation, onSelect, onScaleChange, onSetRotation, onUndo, onClear }: {
  selectedId:     string | null
  placementScale: number
  rotation:       number
  onSelect:       (id: string | null) => void
  onScaleChange:  (v: number) => void
  onSetRotation:  (v: number) => void
  onUndo:         () => void
  onClear:        () => void
}) {
  const [open, setOpen] = useState<Set<string>>(new Set(expandedCats))
  const toggle = (cat: string) => setOpen(prev => {
    const next = new Set(prev)
    next.has(cat) ? next.delete(cat) : next.add(cat)
    return next
  })

  return (
    <>
      {/* Status line */}
      <div style={{ padding: '6px 14px 8px', background: '#0e0800', borderBottom: '1px solid #3a2208', flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: '#907050' }}>
          {selectedId ? `▶ ${CATALOG_MAP_FULL[selectedId]?.name} — click to place` : 'Select an asset below'}
        </div>
      </div>

      {/* Placement controls */}
      {selectedId && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #4a2e08', background: '#120a02', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: '#8a6030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Scale</div>
          <ScaleControl value={placementScale} onChange={onScaleChange} />

          <div style={{ fontSize: 10, color: '#8a6030', letterSpacing: 1.5, textTransform: 'uppercase', margin: '10px 0 6px' }}>
            Rotation <span style={{ color: '#5a4020', fontWeight: 400 }}>(R key)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
            {[0, 90, 180, 270].map(deg => {
              const rad = deg * Math.PI / 180
              const active = Math.abs(rotation - rad) < 0.01
              return (
                <button key={deg} onClick={() => onSetRotation(rad)} style={{
                  ...btn, textAlign: 'center', padding: '5px 4px', fontSize: 11,
                  background: active ? '#3a2000' : '#0e0800',
                  border: `1px solid ${active ? '#f0c040' : '#3a2a10'}`,
                  color: active ? '#f0c040' : '#8a6040',
                }}>
                  {deg}°
                </button>
              )
            })}
          </div>

          <button style={{ ...btn, width: '100%', marginTop: 8, color: '#e87050', borderColor: '#6a2010' }}
            onClick={() => onSelect(null)}>
            ✕ Cancel placement
          </button>
        </div>
      )}

      {/* Asset list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {ALL_CATEGORIES.map(cat => {
          const entries = FULL_CATALOG.filter(e => e.category === cat)
          if (entries.length === 0) return null
          const isOpen = open.has(cat)
          return (
            <div key={cat}>
              <button
                onClick={() => toggle(cat)}
                style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '8px 14px',
                  background: '#0e0600', border: 'none', borderBottom: '1px solid #2a1a04',
                  color: '#c08040', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                  letterSpacing: 1.8, textTransform: 'uppercase', fontFamily: 'inherit' }}>
                <span style={{ marginRight: 6, fontSize: 9 }}>{isOpen ? '▼' : '▶'}</span>
                {cat}
                <span style={{ marginLeft: 'auto', color: '#5a3810', fontSize: 9 }}>{entries.length}</span>
              </button>
              {isOpen && entries.map(e => {
                const active = selectedId === e.id
                return (
                  <button key={e.id} onClick={() => onSelect(active ? null : e.id)} style={{
                    display: 'flex', alignItems: 'center', width: '100%', padding: '7px 14px 7px 22px',
                    background: active ? '#2e1800' : 'transparent', border: 'none',
                    borderLeft: `3px solid ${active ? '#f0c040' : 'transparent'}`,
                    color: active ? '#f0c040' : '#b89860', cursor: 'pointer', fontSize: 12,
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={el => { if (!active) (el.currentTarget as HTMLElement).style.background = '#180e02' }}
                  onMouseLeave={el => { if (!active) (el.currentTarget as HTMLElement).style.background = 'transparent' }}>
                    <span style={{ flex: 1, textAlign: 'left' }}>{e.name}</span>
                    <span style={{ fontSize: 9, color: active ? '#c08040' : '#5a3810',
                      background: '#1a0e02', border: '1px solid #3a2008', borderRadius: 3,
                      padding: '1px 5px', marginLeft: 6 }}>
                      {e.gridW > 1 || e.gridH > 1 ? `${e.gridW}×${e.gridH}` : `×${e.defaultScale}`}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #5a3810', display: 'flex', gap: 6, flexShrink: 0 }}>
        <button style={{ ...btn, flex: 1 }} onClick={onUndo}>↩ Undo</button>
        <button style={{ ...btn, flex: 1, color: '#e87050', borderColor: '#6a2010' }} onClick={onClear}>⊗ Clear All</button>
      </div>
    </>
  )
}

// ── Temple panel ──────────────────────────────────────────────────────────────
function TemplePanel({ item, onClose, onTx }: { item: PlacedItem; onClose: () => void; onTx: () => void }) {
  const [sending, setSending] = React.useState(false)
  const [sent,    setSent]    = React.useState(false)

  const treasuryBalance   = 12_450
  const reinforcements    = TEMPLE_REINFORCE_COUNT
  const reinforceTypes    = TEMPLE_REINFORCE_TYPES

  const troopCounts = reinforceTypes.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] ?? 0) + 1; return acc
  }, {})

  const handleSend = () => {
    if (sending || sent) return
    setSending(true)
    setTimeout(() => { setSending(false); setSent(true); onTx() }, 900)
  }

  return (
    <>
      <div style={{ padding: '12px 14px 10px', background: '#0e0800', borderBottom: '1px solid #5a3810', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f0c040' }}>⛩ {item.name}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#907050', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ fontSize: 10, color: '#7a5030', marginTop: 2 }}>Special Building</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Treasury */}
        <div style={{ background: '#0a1a08', border: '1px solid #2d5a1e', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: '#6a9040', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
            🏦 Hidden Treasury
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: sent ? '#888' : '#22c55e', boxShadow: sent ? 'none' : '0 0 6px #22c55e' }} />
            <span style={{ fontSize: 11, color: sent ? '#777' : '#4ade80', fontWeight: 600 }}>{sent ? 'SENT' : 'ACTIVE'}</span>
          </div>
          <div style={{ fontSize: 12, color: '#c0e080' }}>
            Balance: <strong>{treasuryBalance.toLocaleString()}</strong>
            <span style={{ color: '#6a9040', marginLeft: 4 }}>◈</span>
          </div>
        </div>

        {/* Send button */}
        <button onClick={handleSend} disabled={sending || sent} style={{
          ...btn, width: '100%', textAlign: 'center', padding: '9px 12px',
          background: sent ? '#0a1a00' : sending ? '#1a3000' : '#0d2800',
          borderColor: sent ? '#3a5020' : '#22c55e', color: sent ? '#3a5020' : '#4ade80',
          fontWeight: 700, fontSize: 12, cursor: (sending || sent) ? 'default' : 'pointer',
          opacity: (sending || sent) ? 0.7 : 1,
          transition: 'all 0.2s',
        }}>
          {sending ? '⏳ Sending...' : sent ? '✓ Treasury Sent' : '→ Send Treasury'}
        </button>

        {/* Reinforcements */}
        <div style={{ background: '#1a0a00', border: '1px solid #5a2e10', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: '#a06030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
            ⚔ Reinforcements
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: '#c09050' }}>Available</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f0c040' }}>{reinforcements} / {reinforcements}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(troopCounts).map(([type, count]) => {
              const def = TROOP_DEFS[type as TroopId]
              return (
                <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: '#c09050' }}>{def?.emoji ?? '⚔'} {def?.name ?? type}</span>
                  <span style={{ color: '#e0b060' }}>×{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Barracks panel ────────────────────────────────────────────────────────────
const TRAINABLE_TROOPS: TroopId[] = ['warrior', 'monk', 'rogue', 'ranger', 'cleric', 'wizard']
const TRAIN_TIME: Record<TroopId, number> = {
  warrior: 60, monk: 45, rogue: 90, ranger: 120, cleric: 150, wizard: 180, dragon: 300, bat: 30, ghost: 240,
}
const TRAIN_COST: Record<TroopId, number> = {
  warrior: 120, monk: 90, rogue: 160, ranger: 200, cleric: 250, wizard: 300, dragon: 800, bat: 60, ghost: 350,
}

function BarracksPanel({ item, onClose, onTx }: { item: PlacedItem; onClose: () => void; onTx: () => void }) {
  const [selectedTroop, setSelectedTroop] = React.useState<TroopId>('warrior')
  const [queue, setQueue] = React.useState<TroopId[]>([])
  const [training, setTraining] = React.useState(false)
  const MAX_QUEUE = 5

  const def = TROOP_DEFS[selectedTroop]

  const handleTrain = () => {
    if (training || queue.length >= MAX_QUEUE) return
    setTraining(true)
    setTimeout(() => {
      setQueue(prev => [...prev, selectedTroop])
      setTraining(false)
      onTx()
    }, 800)
  }

  return (
    <>
      <div style={{ padding: '12px 14px 10px', background: '#0e0800', borderBottom: '1px solid #5a3810', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f0c040' }}>🏰 {item.name}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#907050', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ fontSize: 10, color: '#7a5030', marginTop: 2 }}>Military Building</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Queue */}
        <div>
          <div style={{ fontSize: 10, color: '#8a6030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
            Training Queue — {queue.length}/{MAX_QUEUE}
          </div>
          <div style={{ display: 'flex', gap: 4, minHeight: 32, background: '#0a0600', borderRadius: 6, padding: '4px 6px', flexWrap: 'wrap' }}>
            {queue.length === 0
              ? <span style={{ fontSize: 10, color: '#4a3010', alignSelf: 'center', width: '100%', textAlign: 'center' }}>Empty</span>
              : queue.map((t, i) => (
                <div key={i} style={{ fontSize: 16, lineHeight: 1 }} title={TROOP_DEFS[t].name}>
                  {TROOP_DEFS[t].emoji}
                </div>
              ))
            }
          </div>
        </div>

        {/* Troop selector */}
        <div>
          <div style={{ fontSize: 10, color: '#8a6030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Select Troop</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
            {TRAINABLE_TROOPS.map(id => {
              const d = TROOP_DEFS[id]
              const active = selectedTroop === id
              return (
                <button key={id} onClick={() => setSelectedTroop(id)} style={{
                  ...btn, padding: '6px 4px', textAlign: 'center', flexDirection: 'column',
                  background: active ? '#3a2000' : '#0e0800',
                  border: `1px solid ${active ? '#f0c040' : '#3a2a10'}`,
                  color: active ? '#f0c040' : '#8a6040',
                  display: 'flex', alignItems: 'center', gap: 2,
                }}>
                  <span style={{ fontSize: 16 }}>{d.emoji}</span>
                  <span style={{ fontSize: 9 }}>{d.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected troop stats */}
        <div style={{ background: '#0a0600', border: '1px solid #3a2010', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f0c040', marginBottom: 6 }}>
            {def.emoji} {def.name}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[
              ['♥ HP',    def.maxHp],
              ['⚔ DMG',   def.attackDamage],
              ['💨 SPD',   def.speed.toFixed(1)],
              ['🎯 RNG',   def.attackRange.toFixed(1)],
            ].map(([label, val]) => (
              <div key={String(label)} style={{ fontSize: 10, color: '#a08050' }}>
                <span>{label}: </span><strong style={{ color: '#e0c080' }}>{val}</strong>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: '#8a6030', display: 'flex', justifyContent: 'space-between' }}>
            <span>⏱ {TRAIN_TIME[selectedTroop]}s</span>
            <span>💰 {TRAIN_COST[selectedTroop]} gold</span>
          </div>
        </div>

        {/* Train button */}
        <button onClick={handleTrain} disabled={training || queue.length >= MAX_QUEUE} style={{
          ...btn, width: '100%', textAlign: 'center', padding: '9px 12px',
          background: '#1a0800', borderColor: '#d97706', color: '#fbbf24',
          fontWeight: 700, fontSize: 12,
          opacity: (training || queue.length >= MAX_QUEUE) ? 0.5 : 1,
          cursor: (training || queue.length >= MAX_QUEUE) ? 'default' : 'pointer',
        }}>
          {training ? '⏳ Queuing...' : queue.length >= MAX_QUEUE ? 'Queue Full' : `⚔ Train ${def.name}`}
        </button>
      </div>
    </>
  )
}

// ── Storage panel ─────────────────────────────────────────────────────────────
const FARM_STATUS_OPTIONS = ['Growing 🌱', 'Ready ✓', 'Harvesting 🌾', 'Watering 💧']

function StoragePanel({ item, allItems, onClose }: { item: PlacedItem; allItems: PlacedItem[]; onClose: () => void }) {
  const farms = allItems.filter(it => it.defId === 'farm' || it.catalogId === 'farm')

  const wheatMax   = 6000
  const wheatCur   = React.useMemo(() => Math.floor(2800 + Math.random() * 2800), [])
  const wheatPct   = Math.round((wheatCur / wheatMax) * 100)

  const farmStatuses = React.useMemo(() =>
    farms.map((_, i) => ({
      label: `Farm ${i + 1}`,
      status: FARM_STATUS_OPTIONS[i % FARM_STATUS_OPTIONS.length],
      pct: Math.floor(20 + Math.random() * 80),
    }))
  , [farms.length])

  return (
    <>
      <div style={{ padding: '12px 14px 10px', background: '#0e0800', borderBottom: '1px solid #5a3810', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f0c040' }}>🏪 {item.name}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#907050', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ fontSize: 10, color: '#7a5030', marginTop: 2 }}>Resource Building</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Wheat storage */}
        <div style={{ background: '#0a0e00', border: '1px solid #4a5a10', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: '#8a9030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
            🌾 Wheat Storage
          </div>
          <div style={{ height: 8, background: '#1a1a00', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{
              height: '100%', borderRadius: 4,
              width: `${wheatPct}%`,
              background: wheatPct > 80
                ? 'linear-gradient(90deg,#d97706,#fbbf24)'
                : 'linear-gradient(90deg,#65a30d,#a3e635)',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: '#a3e635', fontWeight: 600 }}>{wheatCur.toLocaleString()} kg</span>
            <span style={{ color: '#6a7020' }}>{wheatPct}% of {wheatMax.toLocaleString()}</span>
          </div>
        </div>

        {/* Farm statuses */}
        <div>
          <div style={{ fontSize: 10, color: '#8a6030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
            Farm Status ({farms.length} farm{farms.length !== 1 ? 's' : ''})
          </div>
          {farms.length === 0 ? (
            <div style={{ fontSize: 11, color: '#4a3010', textAlign: 'center', padding: '12px 0' }}>
              No farms placed yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {farmStatuses.map(f => (
                <div key={f.label} style={{
                  background: '#0a0600', borderRadius: 6, padding: '7px 10px',
                  border: '1px solid #2a1a08',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#c09050' }}>{f.label}</span>
                    <span style={{ fontSize: 10, color: '#a0b040' }}>{f.status}</span>
                  </div>
                  <div style={{ height: 4, background: '#1a1000', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${f.pct}%`,
                      background: f.status.includes('Ready')
                        ? '#22c55e'
                        : 'linear-gradient(90deg,#65a30d,#a3e635)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function ItemPanel({ item, onScaleChange, onRotationChange, onUpgradeLevel, onDelete, onClose }: {
  item:             PlacedItem
  onScaleChange:    (v: number) => void
  onRotationChange: (v: number) => void
  onUpgradeLevel:   () => void
  onDelete:         () => void
  onClose:          () => void
}) {
  const isBuilding = !!item.defId && VALID_DEF_IDS.has(item.defId)
  const def = isBuilding ? defFor(item.defId!) : null
  const maxLevel  = isBuilding ? (def!.maxLevel ?? 3) : 3
  const canLevel  = isBuilding && def!.hasLevels && (item.level ?? 1) < maxLevel
  const currentHP = isBuilding ? healthOf(item.defId!, item.age ?? 'SecondAge', item.level ?? 1) : null
  const maxHP     = isBuilding ? healthOf(item.defId!, 'SecondAge', maxLevel as Level) || currentHP! : null
  const nextLvHP  = canLevel   ? healthOf(item.defId!, item.age ?? 'SecondAge', (item.level! + 1) as Level) : null

  const rotDeg = Math.round(item.rotation * 180 / Math.PI)

  return (
    <>
      <div style={{ padding: '12px 14px 10px', background: '#0e0800', borderBottom: '1px solid #5a3810', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f0c040' }}>{item.name}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#907050', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ fontSize: 10, color: '#7a5030', marginTop: 2 }}>{item.category}</div>

        {isBuilding && currentHP !== null && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#70b840' }}>♥ HP</span>
              <span style={{ color: '#c0e080', fontWeight: 600 }}>{currentHP.toLocaleString()}</span>
            </div>
            <div style={{ height: 3, background: '#1a1000', borderRadius: 2, overflow: 'hidden', marginTop: 3 }}>
              <div style={{ height: '100%', width: `${Math.min(100, (currentHP / maxHP!) * 100)}%`,
                background: 'linear-gradient(90deg,#40c840,#80f040)', borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 10, color: '#5a7030', marginTop: 4 }}>
              {item.age === 'FirstAge' ? 'Age I' : 'Age II'}{def!.hasLevels ? ` · Lv ${item.level}` : ''}
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Scale */}
        <div>
          <div style={{ fontSize: 10, color: '#8a6030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Scale</div>
          <ScaleControl value={item.scale} onChange={onScaleChange} />
        </div>

        {/* Rotation */}
        <div>
          <div style={{ fontSize: 10, color: '#8a6030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
            Rotation — {rotDeg}°
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
            {[0, 90, 180, 270].map(deg => {
              const rad = deg * Math.PI / 180
              const active = Math.abs(item.rotation - rad) < 0.01
              return (
                <button key={deg} onClick={() => onRotationChange(rad)} style={{
                  ...btn, textAlign: 'center', padding: '5px 4px', fontSize: 11,
                  background: active ? '#3a2000' : '#0e0800',
                  border: `1px solid ${active ? '#f0c040' : '#3a2a10'}`,
                  color: active ? '#f0c040' : '#8a6040',
                }}>
                  {deg}°
                </button>
              )
            })}
          </div>
        </div>

        {/* Building upgrades */}
        {isBuilding && def!.hasLevels && (
          <div>
            <div style={{ fontSize: 10, color: '#8a6030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Level</div>
            <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
              {([1, 2, 3] as Level[]).filter(lv => lv <= maxLevel).map(lv => {
                const isActive = item.level === lv, isPast = (item.level ?? 1) > lv
                return (
                  <div key={lv} style={{
                    flex: 1, textAlign: 'center', padding: '4px 3px', borderRadius: 4, fontSize: 11,
                    background: isActive ? '#3a2000' : isPast ? '#1a1200' : '#0e0800',
                    border: `1px solid ${isActive ? '#f0c040' : isPast ? '#6a4820' : '#2a1a08'}`,
                    color: isActive ? '#f0c040' : isPast ? '#7a5020' : '#3a2810',
                  }}>
                    <div style={{ fontWeight: 700 }}>{lv}</div>
                    <div style={{ fontSize: 9, marginTop: 1 }}>{healthOf(item.defId!, item.age ?? 'SecondAge', lv).toLocaleString()}</div>
                  </div>
                )
              })}
            </div>
            <button onClick={onUpgradeLevel} disabled={!canLevel} style={{
              ...btn, width: '100%', textAlign: 'center',
              opacity: canLevel ? 1 : 0.4, cursor: canLevel ? 'pointer' : 'default',
              background: canLevel ? '#2a1800' : '#0e0800',
            }}>
              {canLevel ? `↑ Level ${item.level! + 1} (${nextLvHP!.toLocaleString()} HP)` : 'Max Level'}
            </button>
          </div>
        )}

        {isBuilding && (
          <div style={{ fontSize: 10, color: '#5a6030', padding: '4px 8px', background: '#0a1200', borderRadius: 4, textAlign: 'center' }}>
            Age II
          </div>
        )}

        <button onClick={onDelete} style={{ ...btn, width: '100%', textAlign: 'center', color: '#e87050', borderColor: '#6a2010' }}>
          🗑 Remove
        </button>
      </div>
    </>
  )
}

// ── Attack panel ─────────────────────────────────────────────────────────────
function AttackPanel({ inventory, spawned, selectedType, totalBuildings, destroyedCount, gsRef, onSelectType, onExit }: {
  inventory:      TroopInventory
  spawned:        SpawnedTroop[]
  selectedType:   TroopId
  totalBuildings: number
  destroyedCount: number
  gsRef:          React.MutableRefObject<GameStateRef>
  onSelectType:   (t: TroopId) => void
  onExit:         () => void
}) {
  // Tick every 250ms to refresh alive counts without expensive polling
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 250)
    return () => clearInterval(id)
  }, [])

  const aliveByType = Object.fromEntries(
    TROOP_IDS.map(id => [id, spawned.filter(t => t.type === id && !gsRef.current.deadTroops.has(t.uid)).length])
  ) as Record<TroopId, number>

  const remaining   = totalBuildings - destroyedCount
  const pctDestroyed = totalBuildings > 0 ? destroyedCount / totalBuildings : 0
  const stars = pctDestroyed >= 1.0 ? 3 : pctDestroyed >= 0.66 ? 2 : pctDestroyed >= 0.33 ? 1 : 0

  return (
    <>
      {/* Header */}
      <div style={{ padding: '12px 14px 10px', background: '#140000', borderBottom: '1px solid #8a1010', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#ff6040', letterSpacing: 1.4 }}>⚔ ATTACK MODE</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, margin: '6px 0 2px' }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{ fontSize: 20, opacity: i < stars ? 1 : 0.18, filter: i < stars ? 'drop-shadow(0 0 4px gold)' : 'none', transition: 'opacity 0.4s' }}>⭐</span>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#804030', marginTop: 2, textAlign: 'center' }}>
          {remaining > 0 ? `${destroyedCount}/${totalBuildings} destroyed · ${Math.round(pctDestroyed * 100)}%` : '🏆 All destroyed!'}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Troop selector */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #2a1008' }}>
          <div style={{ fontSize: 10, color: '#8a4030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
            Deploy Troop — click on map
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
            {TROOP_IDS.map(id => {
              const def  = TROOP_DEFS[id]
              const cnt  = inventory[id] ?? 0
              const sel  = selectedType === id
              return (
                <button key={id} onClick={() => onSelectType(id)} disabled={cnt === 0} style={{
                  padding: '6px 8px', borderRadius: 5, cursor: cnt > 0 ? 'pointer' : 'not-allowed',
                  background: sel ? '#3a0800' : '#1a0800',
                  border: `1px solid ${sel ? '#ff6040' : '#4a1808'}`,
                  color: cnt === 0 ? '#3a1808' : sel ? '#ff8060' : '#c07050',
                  fontFamily: 'inherit', textAlign: 'left',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>{def.emoji} {def.name}</div>
                  <div style={{ fontSize: 9, marginTop: 2, color: cnt === 0 ? '#3a1808' : '#7a4030' }}>
                    {cnt} left · {aliveByType[id]} alive
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Stats of selected troop */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #2a1008' }}>
          {(() => {
            const def = TROOP_DEFS[selectedType]
            return (
              <>
                <div style={{ fontSize: 10, color: '#8a4030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                  {def.emoji} {def.name} Stats
                </div>
                {([
                  ['HP',       `${def.maxHp}`],
                  ['Speed',    `${def.speed} u/s`],
                  ['Range',    `${def.attackRange} units`],
                  ['Damage',   `${def.attackDamage}/hit`],
                  ['Cooldown', `${def.attackCooldown}s`],
                  ...(def.splashRadius ? [['AoE', `r=${def.splashRadius}`]] : []),
                  ...(def.healAmount   ? [['Heals', `+${def.healAmount} HP`]] : []),
                ] as [string,string][]).map(([k,v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: '#6a3828' }}>{k}</span>
                    <span style={{ color: '#c07050', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </>
            )
          })()}
        </div>

        {/* Deployed summary */}
        <div style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: '#8a4030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
            Deployed ({spawned.filter(t => !gsRef.current.deadTroops.has(t.uid)).length} alive)
          </div>
          {TROOP_IDS.map(id => {
            const alive = aliveByType[id]
            const dead  = spawned.filter(t => t.type === id && gsRef.current.deadTroops.has(t.uid)).length
            if (alive + dead === 0) return null
            const pct = alive / Math.max(alive + dead, 1)
            return (
              <div key={id} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: '#c07050' }}>{TROOP_DEFS[id].emoji} {TROOP_DEFS[id].name}</span>
                  <span style={{ color: '#6a3828' }}>{alive}/{alive + dead}</span>
                </div>
                <div style={{ height: 3, background: '#1a0800', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct * 100}%`, background: pct > 0.5 ? '#40c040' : pct > 0.25 ? '#c0a020' : '#c04020', transition: 'width 0.3s' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '10px 14px', borderTop: '1px solid #5a1808', flexShrink: 0 }}>
        <button onClick={onExit} style={{ ...btn, width: '100%', textAlign: 'center', background: '#200a00', borderColor: '#8a3010', color: '#c05030' }}>
          🔨 Back to Build Mode
        </button>
      </div>
    </>
  )
}

// ── Light manager UI ─────────────────────────────────────────────────────────
function LightManager({ cfg, onChange }: { cfg: LightConfig; onChange: (c: LightConfig) => void }) {
  const [open, setOpen] = useState(false)

  const setAmbient  = (p: Partial<LightConfig['ambient']>)    => onChange({ ...cfg, ambient:    { ...cfg.ambient,    ...p } })
  const setSun      = (p: Partial<LightConfig['sun']>)        => onChange({ ...cfg, sun:        { ...cfg.sun,        ...p } })
  const setFill     = (p: Partial<LightConfig['fill']>)       => onChange({ ...cfg, fill:       { ...cfg.fill,       ...p } })
  const setHemi     = (p: Partial<LightConfig['hemisphere']>) => onChange({ ...cfg, hemisphere: { ...cfg.hemisphere, ...p } })

  const row = (label: string, control: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 22 }}>
      <span style={{ fontSize: 10, color: '#7a5a30', width: 64, flexShrink: 0 }}>{label}</span>
      {control}
    </div>
  )

  const slider = (value: number, min: number, max: number, step: number, onChange: (v: number) => void) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1 }}>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: '#f0c040', height: 14 }} />
      <span style={{ fontSize: 10, color: '#c0a060', width: 30, textAlign: 'right', flexShrink: 0 }}>
        {value % 1 === 0 ? value : value.toFixed(2)}
      </span>
    </div>
  )

  const colorPick = (value: string, onChange: (v: string) => void) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: 28, height: 20, border: '1px solid #5a3810', borderRadius: 3, background: 'none', cursor: 'pointer', padding: 1 }} />
      <span style={{ fontSize: 10, color: '#7a5a30' }}>{value}</span>
    </div>
  )

  const section = (label: string, children: React.ReactNode) => (
    <div>
      <div style={{ fontSize: 9, color: '#8a6030', letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 6, borderBottom: '1px solid #2a1a06', paddingBottom: 3 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  )

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, zIndex: 10, userSelect: 'none',
      fontFamily: "'Segoe UI', sans-serif",
      background: 'rgba(8,4,0,0.93)', border: '1px solid #5a3810',
      borderTop: 'none', borderLeft: 'none', borderBottomRightRadius: 8,
      minWidth: open ? 260 : 0,
    }}>
      {/* Header */}
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
        background: 'none', border: 'none', cursor: 'pointer', width: '100%',
        color: '#f0c040', fontWeight: 700, fontSize: 11, letterSpacing: 1.4,
        fontFamily: 'inherit',
      }}>
        <span>💡</span>
        <span>LIGHTS</span>
        <span style={{ marginLeft: 'auto', color: '#6a4820', fontSize: 9 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '4px 14px 14px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '80vh', overflowY: 'auto' }}>

          {section('Ambient', <>
            {row('Intensity', slider(cfg.ambient.intensity, 0, 2, 0.05, v => setAmbient({ intensity: v })))}
            {row('Color',     colorPick(cfg.ambient.color, c => setAmbient({ color: c })))}
          </>)}

          {section('Sun', <>
            {row('Intensity', slider(cfg.sun.intensity, 0, 3, 0.05,  v => setSun({ intensity: v })))}
            {row('Azimuth',   slider(cfg.sun.azimuth,   0, 360, 1,  v => setSun({ azimuth: v })))}
            {row('Elevation', slider(cfg.sun.elevation,  5, 89, 1,   v => setSun({ elevation: v })))}
            {row('Color',     colorPick(cfg.sun.color, c => setSun({ color: c })))}
          </>)}

          {section('Sky Fill', <>
            {row('Intensity', slider(cfg.fill.intensity, 0, 2, 0.05, v => setFill({ intensity: v })))}
            {row('Color',     colorPick(cfg.fill.color, c => setFill({ color: c })))}
          </>)}

          {section('Hemisphere', <>
            {row('Intensity', slider(cfg.hemisphere.intensity, 0, 1.5, 0.05, v => setHemi({ intensity: v })))}
            {row('Sky',       colorPick(cfg.hemisphere.skyColor,    c => setHemi({ skyColor: c })))}
            {row('Ground',    colorPick(cfg.hemisphere.groundColor, c => setHemi({ groundColor: c })))}
          </>)}

          {section('Renderer', <>
            {row('Exposure', slider(cfg.exposure, 0.5, 2.5, 0.05, v => onChange({ ...cfg, exposure: v })))}
          </>)}

          <button onClick={() => onChange(DEFAULT_LIGHT)}
            style={{ ...btn, fontSize: 11, textAlign: 'center', marginTop: 2 }}>
            ↺ Reset to Default
          </button>
        </div>
      )}
    </div>
  )
}

// ── Saves panel ──────────────────────────────────────────────────────────────
function SavesPanel({ items, lights, onLoad, onBasemapChange }: {
  items:           PlacedItem[]
  lights:          LightConfig
  onLoad:          (items: PlacedItem[], lights?: LightConfig) => void
  onBasemapChange: () => void
}) {
  const [saves,    setSaves]    = useState<SaveSlot[]>(readSaves)
  const [saveName, setSaveName] = useState('')
  const [flash,    setFlash]    = useState<string | null>(null)

  const showFlash = (msg: string) => {
    setFlash(msg)
    setTimeout(() => setFlash(null), 2000)
  }

  const handleSave = () => {
    const name = saveName.trim() || `Save ${saves.length + 1}`
    const slot: SaveSlot = { id: `${Date.now()}`, name, savedAt: Date.now(), items, lights }
    const next = [slot, ...saves].slice(0, 10)
    writeSaves(next); setSaves(next); setSaveName('')
    showFlash(`Saved "${name}"`)
  }

  const handleLoad = (slot: SaveSlot) => {
    onLoad(slot.items, slot.lights)
    showFlash(`Loaded "${slot.name}"`)
  }

  const handleDelete = (id: string) => {
    const next = saves.filter(s => s.id !== id)
    writeSaves(next); setSaves(next)
  }

  const handleSetBasemap = (bItems: PlacedItem[], bLights: LightConfig, label: string) => {
    writeBasemap({ items: bItems, lights: bLights })
    onBasemapChange()
    showFlash(`Basemap set: "${label}"`)
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ version: 1, items, lights }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `clash-map-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        const importedItems: PlacedItem[] = data.items ?? data
        if (!Array.isArray(importedItems)) { showFlash('Invalid file'); return }
        onLoad(importedItems, data.lights)
        showFlash(`Imported ${importedItems.length} items`)
      } catch { showFlash('Could not parse file') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const fmtDate = (ts: number) => {
    const d = new Date(ts)
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <>
      {/* Save current */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #4a2e08', background: '#120a02', flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: '#8a6030', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
          Save current map ({items.length} items)
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder={`Save ${saves.length + 1}`}
            style={{
              flex: 1, padding: '5px 8px', background: '#0e0800', border: '1px solid #5a3810',
              borderRadius: 4, color: '#d8c090', fontSize: 12, fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <button onClick={handleSave} style={{ ...btn, padding: '5px 12px', background: '#2a1800', borderColor: '#f0c040', color: '#f0c040', fontWeight: 700 }}>
            Save
          </button>
        </div>
        <button
          onClick={() => handleSetBasemap(items, lights, 'current map')}
          style={{ ...btn, width: '100%', marginTop: 6, fontSize: 11, color: '#a0d8f0', borderColor: '#2060a0', background: '#060e18' }}
        >
          ⚑ Set current map as Basemap
        </button>

        {flash && (
          <div style={{ marginTop: 6, fontSize: 11, color: '#70d070', textAlign: 'center' }}>{flash}</div>
        )}
      </div>

      {/* Slots list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {saves.length === 0 ? (
          <div style={{ padding: '20px 14px', fontSize: 12, color: '#4a3010', textAlign: 'center' }}>
            No saves yet
          </div>
        ) : saves.map(slot => (
          <div key={slot.id} style={{
            padding: '8px 14px', borderBottom: '1px solid #2a1a04',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: '#d8c090', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {slot.name}
              </div>
              <div style={{ fontSize: 10, color: '#5a3810', marginTop: 2 }}>
                {fmtDate(slot.savedAt)} · {slot.items.length} items
              </div>
            </div>
            <button onClick={() => handleLoad(slot)} style={{ ...btn, padding: '3px 8px', fontSize: 11, color: '#80d080', borderColor: '#2a6020', background: '#0a1a06' }}>
              Load
            </button>
            <button onClick={() => handleSetBasemap(slot.items, slot.lights ?? DEFAULT_LIGHT, slot.name)} style={{ ...btn, padding: '3px 8px', fontSize: 11, color: '#a0d8f0', borderColor: '#2060a0', background: '#060e18' }} title="Set as Basemap">
              ⚑
            </button>
            <button onClick={() => handleDelete(slot.id)} style={{ ...btn, padding: '3px 8px', fontSize: 11, color: '#e87050', borderColor: '#6a2010', background: '#1a0600' }}>
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Export / Import */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #5a3810', display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={handleExport} style={{ ...btn, flex: 1, fontSize: 11 }}>
          ↓ Export JSON
        </button>
        <label style={{ ...btn, flex: 1, fontSize: 11, textAlign: 'center', cursor: 'pointer' }}>
          ↑ Import JSON
          <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </label>
      </div>
    </>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
const CAM: [number, number, number] = [42, 58, 42]

export default function App() {
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null)
  const [selectedItemId,    setSelectedItemId]    = useState<string | null>(null)
  const [rotation,          setRotation]           = useState(0)
  const [placementScale,    setPlacementScale]     = useState(5)
  const [cursor,            setCursor]             = useState<[number, number] | null>(null)
  const [items,             setItems]              = useState<PlacedItem[]>(() => readBasemap()?.items ?? DEFAULT_ENV_ITEMS)
  const [showSaves,         setShowSaves]          = useState(false)
  const [showMarket,        setShowMarket]         = useState(false)
  const [showPreview,       setShowPreview]        = useState(false)
  const [lightConfig,       setLightConfig]        = useState<LightConfig>(() => readBasemap()?.lights ?? DEFAULT_LIGHT)

  // ── Attack mode ──────────────────────────────────────────────────────────────
  const [mode,                 setMode]                 = useState<'build' | 'attack'>('build')
  const [spawnedTroops,        setSpawnedTroops]        = useState<SpawnedTroop[]>([])
  const [selectedTroopType,    setSelectedTroopType]    = useState<TroopId>('warrior')
  const [troopInventory,       setTroopInventory]       = useState<TroopInventory>({} as TroopInventory)
  const [destroyedBuildingIds, setDestroyedBuildingIds] = useState<string[]>([])
  const [totalBuildingCount,   setTotalBuildingCount]   = useState(0)

  const gameStateRef = useRef<GameStateRef>({
    buildings: [], buildingHp: {}, troopHp: {}, troopTypes: {}, troopSides: {},
    troopPositions: {}, deadTroops: new Set(), destroyedBuildings: new Set(),
    attackedBuildings: new Set(), defenseTimers: {}, templeReinforced: new Set(), projectiles: [],
  })

  const { toasts: txToasts, fire: fireTxToast } = useTxToast()

  const selectedEntry = selectedCatalogId ? CATALOG_MAP_FULL[selectedCatalogId] ?? null : null
  const occupiedSet   = useMemo(() => buildOccupiedSet(items), [items])

  const ghostRotated = Math.abs(Math.sin(rotation)) > 0.5
  const ghostW = ghostRotated ? (selectedEntry?.gridH ?? 1) : (selectedEntry?.gridW ?? 1)
  const ghostH = ghostRotated ? (selectedEntry?.gridW ?? 1) : (selectedEntry?.gridH ?? 1)

  const ghostPos = useMemo<[number, number, number] | null>(() => {
    if (!selectedEntry || !cursor) return null
    return snapForItem(cursor[0], cursor[1], ghostW, ghostH)
  }, [selectedEntry, cursor, ghostW, ghostH])

  const ghostValid = useMemo(() => {
    if (!ghostPos || !selectedEntry) return true
    return !hasCollision(ghostPos, { ...selectedEntry, gridW: ghostW, gridH: ghostH }, occupiedSet)
  }, [ghostPos, selectedEntry, ghostW, ghostH, occupiedSet])

  // R key rotates during placement; Escape cancels
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelectedCatalogId(null); setSelectedItemId(null) }
      if (e.key === 'r' || e.key === 'R') {
        if (selectedCatalogId) {
          setRotation(r => (r + Math.PI / 2) % (Math.PI * 2))
        } else if (selectedItemId) {
          setItems(prev => prev.filter(it => it.id !== selectedItemId))
          setSelectedItemId(null)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedCatalogId, selectedItemId])

  const handleSelectCatalog = (id: string | null) => {
    setSelectedCatalogId(id)
    setSelectedItemId(null)
    setRotation(0)
    if (id) setPlacementScale(CATALOG_MAP_FULL[id]?.defaultScale ?? 5)
  }

  const handlePlace = (x: number, z: number) => {
    if (!selectedEntry) return
    const pos = snapForItem(x, z, ghostW, ghostH)
    const newItem: PlacedItem = {
      id:        `${Date.now()}-${Math.random()}`,
      catalogId: selectedEntry.id,
      path:      selectedEntry.path,
      name:      selectedEntry.name,
      category:  selectedEntry.category,
      position:  pos,
      rotation,
      scale:     placementScale,
      gridW:     ghostW,
      gridH:     ghostH,
      ...(selectedEntry.defId ? {
        defId: selectedEntry.defId,
        age:   'SecondAge' as Age,
        level: 1 as Level,
      } : {}),
    }
    // Use functional update so concurrent drag placements see fresh state
    setItems(prev => {
      if (hasCollision(pos, { ...selectedEntry!, gridW: ghostW, gridH: ghostH }, buildOccupiedSet(prev))) return prev
      fireTxToast()
      return [...prev, newItem]
    })
  }

  const handleScaleItem = (v: number) => setItems(prev =>
    prev.map(it => it.id === selectedItemId ? { ...it, scale: v } : it))

  const handleRotateItem = (v: number) => setItems(prev =>
    prev.map(it => it.id === selectedItemId ? { ...it, rotation: v } : it))

  const handleUpgradeLevel = () => {
    const cur = items.find(it => it.id === selectedItemId)
    if (!cur?.defId || !VALID_DEF_IDS.has(cur.defId)) return
    const def = defFor(cur.defId)
    if (!def.hasLevels || (cur.level ?? 1) >= (def.maxLevel ?? 3)) return
    setItems(prev => prev.map(it => {
      if (it.id !== selectedItemId) return it
      const newLevel = ((it.level ?? 1) + 1) as Level
      return { ...it, level: newLevel, path: def.pathFor(it.age ?? 'SecondAge', newLevel) }
    }))
    fireTxToast()
  }

  const handleDelete = () => {
    setItems(prev => prev.filter(it => it.id !== selectedItemId))
    setSelectedItemId(null)
  }

  const handleLoadSave = (loaded: PlacedItem[], loadedLights?: LightConfig) => {
    setItems(loaded)
    if (loadedLights) setLightConfig(loadedLights)
    setSelectedItemId(null)
    setSelectedCatalogId(null)
    setShowSaves(false)
  }

  // Sync destroyed buildings from game ref to React state every 250ms
  useEffect(() => {
    if (mode !== 'attack') return
    const id = setInterval(() => {
      const gs = gameStateRef.current
      if (gs.destroyedBuildings.size > 0) {
        const ids = [...gs.destroyedBuildings]
        gs.destroyedBuildings.clear()
        setDestroyedBuildingIds(prev => [...new Set([...prev, ...ids])])
        fireTxToast()
      }
    }, 250)
    return () => clearInterval(id)
  }, [mode, fireTxToast])

  const enterAttackMode = () => {
    // Filter to items with a defId recognised by the current catalog (guards against stale saves)
    const buildings = items.filter(it => !!it.defId && VALID_DEF_IDS.has(it.defId))
    const buildingHp: Record<string, number> = {}
    buildings.forEach(it => {
      buildingHp[it.id] = healthOf(it.defId!, it.age ?? 'SecondAge', it.level ?? 1)
    })

    const inv = Object.fromEntries(TROOP_IDS.map(id => [id, TROOP_START_COUNT])) as TroopInventory

    gameStateRef.current = {
      buildings, buildingHp, troopHp: {}, troopTypes: {}, troopSides: {},
      troopPositions: {}, deadTroops: new Set(), destroyedBuildings: new Set(),
      attackedBuildings: new Set(), defenseTimers: {}, templeReinforced: new Set(), projectiles: [],
    }

    setTotalBuildingCount(buildings.length)
    setDestroyedBuildingIds([])
    setSpawnedTroops([])
    setTroopInventory(inv)
    setSelectedTroopType('warrior')
    setSelectedCatalogId(null)
    setSelectedItemId(null)
    setMode('attack')
  }

  const exitAttackMode = () => {
    setMode('build')
    setSpawnedTroops([])
    setDestroyedBuildingIds([])
    gameStateRef.current = {
      buildings: [], buildingHp: {}, troopHp: {}, troopTypes: {}, troopSides: {},
      troopPositions: {}, deadTroops: new Set(), destroyedBuildings: new Set(),
      attackedBuildings: new Set(), defenseTimers: {}, templeReinforced: new Set(), projectiles: [],
    }
  }

  const handleSpawnTroop = (x: number, z: number) => {
    const remaining = troopInventory[selectedTroopType] ?? 0
    if (remaining <= 0) return

    const gs = gameStateRef.current

    // Block spawning inside intact wall perimeter (allowed if walls are conquered)
    if (isInsideWalls(x, z, gs.buildings, gs.buildingHp)) return

    const isBat  = selectedTroopType === 'bat'
    const count  = isBat ? Math.min(BAT_SWARM_SIZE, remaining) : 1
    const cx     = Math.round(x - 0.5) + 0.5
    const cz     = Math.round(z - 0.5) + 0.5
    const newTroops: SpawnedTroop[] = []

    const spawnY = TROOP_DEFS[selectedTroopType].isFlying
      ? troopFlyY(selectedTroopType)
      : TROOP_SPAWN_Y

    for (let i = 0; i < count; i++) {
      const uid = `${Date.now()}-${Math.random()}`
      // Spread bats in a tight ring around the click point
      const angle  = (i / count) * Math.PI * 2
      const spread = isBat ? (i === 0 ? 0 : 1.2) : 0
      const pos: [number, number, number] = [
        cx + Math.cos(angle) * spread,
        spawnY,
        cz + Math.sin(angle) * spread,
      ]
      gs.troopHp[uid]        = TROOP_DEFS[selectedTroopType].maxHp
      gs.troopTypes[uid]     = selectedTroopType
      gs.troopSides[uid]     = 'attacker'
      gs.troopPositions[uid] = pos
      newTroops.push({ uid, type: selectedTroopType, initPos: pos, side: 'attacker' })
    }

    setSpawnedTroops(prev => [...prev, ...newTroops])
    setTroopInventory(prev => ({ ...prev, [selectedTroopType]: prev[selectedTroopType] - count }))
    fireTxToast()
  }

  const handleTroopDied = (uid: string) => {
    gameStateRef.current.deadTroops.add(uid)
    setSpawnedTroops(prev => prev.filter(t => t.uid !== uid))
  }

  const handleSpawnDefender = (pos: [number,number,number], type: TroopId) => {
    const uid    = `def-${Date.now()}-${Math.random()}`
    const gs     = gameStateRef.current
    const spawnY = TROOP_DEFS[type].isFlying ? troopFlyY(type) : TROOP_SPAWN_Y
    const initPos: [number,number,number] = [pos[0], spawnY, pos[2]]
    gs.troopHp[uid]        = TROOP_DEFS[type].maxHp
    gs.troopTypes[uid]     = type
    gs.troopSides[uid]     = 'defender'
    gs.troopPositions[uid] = initPos
    setSpawnedTroops(prev => [...prev, { uid, type, initPos, side: 'defender' }])
  }

  const selectedItem = items.find(it => it.id === selectedItemId) ?? null

  return (
    <div style={{ width: '100%', height: '100%', background: '#5ba8d4' }}>
      <style>{TX_TOAST_STYLES}</style>
      <TxToastContainer toasts={txToasts} />
      <Canvas
        camera={{ position: CAM, fov: 46, near: 0.5, far: 800 }}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: lightConfig.exposure }}
        style={{ cursor: (selectedEntry || mode === 'attack') ? 'crosshair' : 'grab' }}
      >
        <color attach="background" args={['#7ec8e3']} />
        <fog attach="fog" args={['#b8dff0', 160, 500]} />

        <CameraSetup />
        <OrbitControls
          enabled={mode === 'attack' || !selectedEntry}
          target={[0, 0, 0]}
          minPolarAngle={Math.PI / 5} maxPolarAngle={Math.PI / 2.5}
          minDistance={20} maxDistance={120}
          enablePan panSpeed={0.7} zoomSpeed={0.75} rotateSpeed={0.4}
          screenSpacePanning={false}
        />

        <SceneLights cfg={lightConfig} />

        <OuterTerrain />
        <GroundPlane />
        <PointerPlane
          active={!!selectedEntry}
          onCursor={setCursor}
          onPlace={handlePlace}
          spawnActive={mode === 'attack'}
          onSpawn={handleSpawnTroop}
          isPainting={selectedEntry?.category === 'Walls'}
        />
        <GreenBorder />
        <OceanPlane />
        <DustMotes />

        {/* Hide destroyed buildings in attack mode */}
        <PlacedItems
          items={mode === 'attack' ? items.filter(it => !destroyedBuildingIds.includes(it.id)) : items}
          selectedId={mode === 'build' ? selectedItemId : null}
          canSelect={mode === 'build' && !selectedEntry}
          onSelect={id => { if (!selectedEntry) setSelectedItemId(id) }}
        />

        {/* Building HP bars in attack mode */}
        {mode === 'attack' && items
          .filter(it => it.defId && VALID_DEF_IDS.has(it.defId) && !destroyedBuildingIds.includes(it.id))
          .map(it => (
            <BuildingHpBar key={it.id} item={it} maxHp={healthOf(it.defId!, it.age ?? 'SecondAge', it.level ?? 1)} gsRef={gameStateRef} />
          ))
        }

        {/* Rubble: destroyed non-wall buildings replaced by cut-tree-group debris */}
        {mode === 'attack' && destroyedBuildingIds.map(id => {
          const it = items.find(i => i.id === id)
          if (!it || it.category === 'Walls') return null
          const cx = it.position[0] + (it.gridW - 1) / 2
          const cz = it.position[2] + (it.gridH - 1) / 2
          // 1×1 → scale 1, 5×5 → scale 5
          const rubbleScale = Math.max(it.gridW, it.gridH)
          return (
            <Suspense key={`rubble-${id}`} fallback={null}>
              <Model
                path="/models/Resource_PineTree_Group_Cut.gltf"
                position={[cx, 0, cz]}
                scale={rubbleScale}
              />
            </Suspense>
          )
        })}

        {/* Physics world — troops + building colliders (attack mode only) */}
        {mode === 'attack' && (
          <Physics gravity={[0, -20, 0]}>
            {/* Ground plane collider — walkers land on this */}
            <RigidBody type="fixed" colliders={false}>
              <CuboidCollider
                args={[OUTER_SIZE / 2, 0.1, OUTER_SIZE / 2]}
                position={[0, -0.1, 0]}
                collisionGroups={interactionGroups([GRP_GROUND], [GRP_WALKER])}
              />
            </RigidBody>

            {/* Per-building colliders (removed when destroyed) */}
            <BuildingColliders
              buildings={gameStateRef.current.buildings}
              destroyedIds={destroyedBuildingIds}
            />

            {/* Trees, rocks, and mountains block walkers */}
            <EnvColliders items={items} />

            {/* Spawned troops */}
            {spawnedTroops.map(t => (
              <Suspense key={t.uid} fallback={null}>
                <AnimatedTroop troop={t} gsRef={gameStateRef} onDied={handleTroopDied} />
              </Suspense>
            ))}
          </Physics>
        )}

        {/* Defense AI + projectiles — outside Physics (no rigid bodies needed) */}
        {mode === 'attack' && (
          <>
            <DefenseSystem gsRef={gameStateRef} onSpawnDefender={handleSpawnDefender} />
            <Suspense fallback={null}>
              <ProjectileRenderer gsRef={gameStateRef} />
            </Suspense>
          </>
        )}

        {/* Placement ghost (build mode only) */}
        {mode === 'build' && selectedEntry && ghostPos && (
          <Suspense fallback={null}>
            <GhostItem
              path={selectedEntry.path}
              position={ghostPos}
              rotation={rotation}
              scale={placementScale}
              w={ghostW}
              h={ghostH}
              valid={ghostValid}
            />
          </Suspense>
        )}
      </Canvas>

      {/* Sidebar */}
      <div style={{
        position: 'fixed', top: 0, right: 0, width: PANEL_W, height: '100%',
        background: 'rgba(8,4,0,0.95)', borderLeft: '2px solid #5a3810',
        display: 'flex', flexDirection: 'column', zIndex: 10,
        fontFamily: "'Segoe UI', sans-serif", userSelect: 'none',
      }}>
        {/* Persistent top bar */}
        <div style={{
          padding: '10px 14px', background: '#080400', borderBottom: '2px solid #5a3810',
          display: 'flex', alignItems: 'center', flexShrink: 0, gap: 6,
        }}>
          <span style={{ flex: 1, color: mode === 'attack' ? '#ff6040' : '#f0c040', fontWeight: 700, fontSize: 12, letterSpacing: 1.2 }}>
            {mode === 'attack' ? '⚔ ATTACK' : 'MAP DESIGNER'}
          </span>
          {mode === 'build' && (
            <>
              <button
                onClick={() => setShowPreview(true)}
                style={{ ...btn, padding: '4px 8px', fontSize: 10 }}
                title="Final Map Preview"
              >
                🗺
              </button>
              <button
                onClick={() => setShowMarket(true)}
                style={{ ...btn, padding: '4px 8px', fontSize: 10 }}
                title="Market"
              >
                🏪
              </button>
              <button
                onClick={() => { setShowSaves(s => !s); setSelectedCatalogId(null) }}
                style={{ ...btn, padding: '4px 8px', fontSize: 10, background: showSaves ? '#2a1800' : '#1e1206', borderColor: showSaves ? '#f0c040' : '#6a4820', color: showSaves ? '#f0c040' : '#d8c090' }}
              >
                💾
              </button>
            </>
          )}
          <button
            onClick={mode === 'build' ? enterAttackMode : exitAttackMode}
            style={{
              ...btn, padding: '4px 10px', fontSize: 10,
              background: mode === 'attack' ? '#200a00' : '#0a1a00',
              borderColor: mode === 'attack' ? '#ff4020' : '#40a020',
              color: mode === 'attack' ? '#ff6040' : '#60d040',
              fontWeight: 700,
            }}
          >
            {mode === 'attack' ? '🔨 Build' : '⚔ Attack'}
          </button>
        </div>

        {mode === 'attack' ? (
          <AttackPanel
            inventory={troopInventory}
            spawned={spawnedTroops}
            selectedType={selectedTroopType}
            totalBuildings={totalBuildingCount}
            destroyedCount={destroyedBuildingIds.length}
            gsRef={gameStateRef}
            onSelectType={setSelectedTroopType}
            onExit={exitAttackMode}
          />
        ) : showSaves ? (
          <SavesPanel items={items} lights={lightConfig} onLoad={handleLoadSave} onBasemapChange={() => {}} />
        ) : selectedItem && !selectedEntry ? (
          selectedItem.defId === 'temple' ? (
            <TemplePanel item={selectedItem} onClose={() => setSelectedItemId(null)} onTx={fireTxToast} />
          ) : selectedItem.defId === 'barracks' ? (
            <BarracksPanel item={selectedItem} onClose={() => setSelectedItemId(null)} onTx={fireTxToast} />
          ) : selectedItem.defId === 'storage' ? (
            <StoragePanel item={selectedItem} allItems={items} onClose={() => setSelectedItemId(null)} />
          ) : (
          <ItemPanel
            item={selectedItem}
            onScaleChange={handleScaleItem}
            onRotationChange={handleRotateItem}
            onUpgradeLevel={handleUpgradeLevel}
            onDelete={handleDelete}
            onClose={() => setSelectedItemId(null)}
          />
          )
        ) : (
          <CatalogPanel
            selectedId={selectedCatalogId}
            placementScale={placementScale}
            rotation={rotation}
            onSelect={handleSelectCatalog}
            onScaleChange={setPlacementScale}
            onSetRotation={setRotation}
            onUndo={() => setItems(p => p.slice(0, -1))}
            onClear={() => { const bm = readBasemap(); setItems(bm?.items ?? DEFAULT_ENV_ITEMS); setLightConfig(bm?.lights ?? DEFAULT_LIGHT); setSelectedItemId(null) }}
          />
        )}
      </div>

      {/* Light manager — top-left */}
      <LightManager cfg={lightConfig} onChange={setLightConfig} />

      {/* Market drawer */}
      {showMarket && <MarketDrawer onClose={() => setShowMarket(false)} />}

      {/* Final map preview — full-screen overlay over the builder */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <FinalMapCanvas
            items={items}
            cfg={lightConfig}
            onClose={() => setShowPreview(false)}
          />
        </div>
      )}
    </div>
  )
}
