# Smoosic Constitution
Smoosic is a music notation application that runs in a web browser.  Central to Smoosic is SMO, serializable musical objects.  Scores, staves, measures and notes can all be serialized and deseralized in various ways, both for persistence and representation visually or through sound or common data-exchange formats like MusicXML.

Smoosic rendering is done using the vexflow library.  We have our own fork of this library.

This is an open-source project with (so far) a small number of active contributors.

## Core Principles
The most important part of the Smoosic repository is the music representation in src/smo.  For new musical features, unit testing should focus on score serialization and transformations.

This is an SVG application, so rendering performance is very important.  We take care to avoid repainting penalties and track render state to minimize the repainting we have to do.

We try to avoid race conditions by judicious use of async/await.

A lower priority is rendering regression.  We want to make sure the logic is free from errors and exceptions, but we don't need to test rendering UI changes in this application.

### Principle #1: Serialization
When features are added to Smoosic, we need to make sure that scores, measures and notes can be serialized and deserialized, including legacy scores that didn't know about these features.  This sometimes means adding default settings for features that are missing.

### Principle #2: Music editing and transformation logic (non-UI)
Transformations of music pitches and lengths, the calculations of selections, accidentals and clefs should be regression tested when new music features are added.

### Principle #3: Rendering performance
This is an SVG application.  For large scores, it is crucial that we render the entire score before doing any DOM measurements to avoid repainting penalties.  The logic in scoreRender.ts, renderState.ts, and the Vex rendering logic in src/render/sui/vex.

### Principle #4: Logical dependencies
The smo classes should be free of any rendering or UI dependencies.  We do allow svg mixins for musical objects but this information is ephemeral.  The rendering logic should likewise not be dependent on any UI.  The mapper/tracker classes in the renderer bridge rendering and the UI by tracking geometry and abstract events. 

Smoosic can be either a music and rendering library, or a full application.  We allow the application to be started in different ways to support this.

## The Smoosic ecosystem
There are 6 related repositories for Smoosic in Github.  

1. [Smoosic](https://github.com/Smoosic/Smoosic) (this repository) is the source code for the application and associated library, and is the main Smoosic project repository.
2. [Demos](https://github.com/Smoosic/Demos) contains test and demo applications. If we implement visual regression tests, or anything else using the UI or headless browser, they would be done here.
3. [vexflow_smoosic](https://github.com/Smoosic/vexflow_smoosic) repository contains our own fork of the vexflow engraving library, a sister-project of Smoosic.
4. [SmoSchema](https://github.com/Smoosic/SmoSchema) contains the definition of the JSON schema 'Serializable Music Objects' that Smoosic uses to persist files, and tools for validation, and possibly other utilities.
5. [SmoSounds](https://github.com/Smoosic/SmoSounds) library contains .mp3 samples used for audio playback, and referenced in the demo projects.
6. [SmoScores](https://github.com/Smoosic/SmoScores) The repository for music written in SMO, or for the SMO application. The Smoosic application library points to this repository.
