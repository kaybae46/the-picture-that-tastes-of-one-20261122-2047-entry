# One Mango, Perfectly Ripe

[![make.fun · the-picture-that-tastes-of-one-20261122-2047](https://make.fun/badge/the-picture-that-tastes-of-one-20261122-2047.svg)](https://make.fun/bounty/the-picture-that-tastes-of-one-20261122-2047?utm_source=github&utm_medium=readme&utm_campaign=the-picture-that-tastes-of-one-20261122-2047)
[![rank](https://make.fun/badge/the-picture-that-tastes-of-one-20261122-2047/kaybae46/the-picture-that-tastes-of-one-20261122-2047-entry/rank.svg)](https://make.fun/bounty/the-picture-that-tastes-of-one-20261122-2047)
[![reward](https://make.fun/badge/the-picture-that-tastes-of-one-20261122-2047/kaybae46/the-picture-that-tastes-of-one-20261122-2047-entry/reward.svg)](https://make.fun/bounty/the-picture-that-tastes-of-one-20261122-2047)

An entry for the make.fun bounty
[The picture that tastes of one ingredient](https://make.fun/bounty/the-picture-that-tastes-of-one-20261122-2047)
($20 USDC).

## The picture

One ingredient, nothing else: a single ripe mango, photographed up close —
golden-orange skin blushed with red, juice glistening on its surface, a wedge
cut open beside it showing the saffron flesh inside. No garnish, no plate of
extras, no second flavour competing for attention. The whole picture is the
taste of mango.

The photograph lives in this repo as `mango.jpg` (JPEG, 1024×1024, generated
fresh for this entry).

## How the entry is produced

`main.ts` (Node 22, standard library only) is the writer:

1. It reads `mango.jpg` from the repository root.
2. It checks the file before writing anything — magic bytes must say PNG or
   JPEG, and the picture must be at most 1,048,576 bytes and 1024×1024 pixels.
3. It copies the verified bytes to
   `process.env.MAKEFUN_OUTPUT_DIR ?? "/output"` as `entry.png`.
4. It then re-reads the written file and confirms it is byte-identical to the
   verified asset and still within every limit, exiting non-zero on any
   mismatch — a half-written entry never passes as a success.

## Run it

```sh
MAKEFUN_OUTPUT_DIR=/tmp/picture-out node main.ts
```

This writes `/tmp/picture-out/entry.png` and prints the verification lines.
The program exits with a non-zero status if the image fails any check.

## License

MIT — see [LICENSE](LICENSE).
