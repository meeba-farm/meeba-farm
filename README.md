# Meeba Farm
A D3 driven environment, full of constantly evolving _meebas_. Watch as their own feeding, predation, and reproduction drives the population to change over time through natural selection.

## Usage
To checkout the newest version of Meeba Farm, simply go to [meeba-farm.github.io](http://meeba-farm.github.io/meeba-farm/) and enjoy. Your browser window will immediately fill with meebas, who will begin to eat, die, and reproduce. You can mess with various settings by clicking on the gear in the upper right corner, and you can spawn new meebas simply by clicking on the screen. Have fun!

## Contributing
You can submit bugs or suggestions via GitHub issues, as well as fork this repo and submit your own PRs. Contributions are welcome, but may or may not be accepted.

## Roadmap
Eventually I would like to build out _Meeba Farm_ with more complex behavior, and interactions. This is the general roadmap you can expect:

### Phase 1 (Plankton)
_(current phase)_

In Phase 1, meebas are simple creatures incapable of sensing their surroundings or moving under their own power. Their genome consist only of _size_ and _spike_ genes, allowing them to vary in size, spike count, length, and position. They bounce around in a frictionless tank and will consume whatever they come in contact with.

Phase 1 is currently feature complete, and requires only some balance tweaks and general polish.

### Phase 2 (Locomotion)
Meebas will gain "squiggles", which will allow them to move around their environment which will now have friction. Like spikes, squiggles can vary in size, quantity and location. In addition, Meebas will gain a basic AI which will allow them to decide where to move based on an omniscient knowledge of their surroundings.

### Phase 3 (AI)
Meebas will gain "spots", which will grant them specific visions cones, and can vary in size, quantity, and position. Utilizing these vision cones will be a more complex AI that is also dictated by genes and can evolve over time. The AI will make decisions based on levels of aggression, fear, and other emotional genes, which will be made visible by the color of the meebas.
