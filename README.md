# 🏖️ BADBUNNY — Pinball de playa en realidad virtual

Pinball con temática de playa para **realidad virtual (WebXR)**, hecho en **Unity 6** con **Needle Engine**. Se juega en el navegador del computador, del celular o de unas gafas **Meta Quest**.

**▶️ Experiencia publicada:** https://collaborativesandbox-2nx2chz119oh-ljith.needle.run

## Equipo
- Sary Payan
- Dana Melisa Giraldo
- Isabela Calvo

## Descripción
Una mesa de pinball a escala real (0.9 m de alto) sobre un piso de arena de 6 × 6 m, rodeada de sombrillas, sillas, palmeras, una cubeta y una pelota de playa. En la mesa hay tres bumpers de coco, una casita, slingshots, un sol giratorio y mascotas (cangrejo, coco y tiburón inflable). La física usa Rapier (el motor de Needle) con la gravedad inclinada 6.5° para que la bola ruede hacia los flippers.

## Interacciones
| Interacción | Escritorio | Celular / tacto | VR (Quest) |
|---|---|---|---|
| **Plunger (perilla roja)**: jalarlo hacia atrás y soltarlo lanza la bola con fuerza proporcional | Arrastrar con el mouse | Arrastrar con el dedo | Apuntar con el gatillo y jalar la mano |
| **Flippers** | `Z` (izq.) · `/` o `→` (der.) | Tocar mitad izquierda / derecha | Gatillo izquierdo / derecho |
| **Bumpers de coco**: rebote extra y se iluminan | — | — | — |
| **Sol**: prende y apaga los cocos | Clic | Tocar | Gatillo |
| **Decoración** (Decor_*, Mascot_*): se agarra y se mueve, sin salir del cuarto | Arrastrar | Arrastrar | Agarrar con el gatillo |
| **Teletransporte** por el piso | — | — | Stick del control |

Si la bola cae al drenaje, reaparece sola frente al Plunger.

## Estructura del repositorio
- `Assets/`, `Packages/`, `ProjectSettings/`: proyecto de Unity 6 (6000.3, URP). La escena principal es `Assets/Pinball.unity`.
- `Needle/newProject/`: proyecto web de Needle Engine. Los scripts del juego están en `src/scripts/`:
  - `PinballSetup.ts`: va en el objeto *Pinball*; configura la física, los colliders y las interacciones por nombre.
  - `PinballPlunger.ts`, `PinballFlipper.ts`, `PinballBumper.ts`, `PinballBall.ts`, `KeepInRoom.ts`.

## Cómo abrirlo
1. Clonar el repositorio y abrirlo con **Unity 6000.3** en Unity Hub.
2. Tener instalado **Node.js 22 o 24 LTS**. Needle Engine instala las dependencias web (`node_modules`) la primera vez que se le da Play.
3. Abrir la escena `Pinball` y darle **Play**: se abre el navegador con la experiencia.
4. Para publicar: objeto *Needle Engine* → **Publish to Needle Cloud**.
