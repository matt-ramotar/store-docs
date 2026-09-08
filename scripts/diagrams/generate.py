"""Rebuild every standalone diagram from the authored layout and Store theme."""
from flows import generate as flows
from persistence import generate as persistence
from sequences import generate as sequences
from store5 import generate as store5


if __name__ == '__main__':
    for generate in (flows, persistence, sequences, store5):
        for slug in generate():
            print(f'public/diagrams/{slug}.html')
