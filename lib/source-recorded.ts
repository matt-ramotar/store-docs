// These exact revisions were resolved in the Store6 checkout and checked
// against its fork remote. Unknown revisions remain text until attributed.
const sourceRevisions: Record<string, string> = {
  c67a94ed: "c67a94ed30460a35161c2cbc3e725f127caf055e",
  a6a156e9: "a6a156e99db29cebf7da238263b007802bff2bfb",
  "539614c0": "539614c06be1a8f20dead562585e47394551ebae",
  be470620: "be47062070eba8f8a327279e9c5a68caa0ef06ca",
  c4fbaf4: "c4fbaf442f61a59c57f3d8dd98650b4066508d66",
  "5a8c956b": "5a8c956bc1dbd6ad838ea9da3b34c7d76c703a71",
};

export function parseRecordedSource(value: string) {
  const match = /^Last verified: (\d{4}-\d{2}-\d{2}) · (\S+) @ ([0-9a-f]{7,40}), (.+)$/.exec(value);
  if (!match) return undefined;
  const [, date, branch, hash, status] = match;
  const revision = sourceRevisions[hash] ?? Object.values(sourceRevisions).find((known) => known === hash);
  return {
    date,
    branch,
    hash,
    status,
    commitUrl: revision ? `https://github.com/matt-ramotar/Store6/commit/${revision}` : undefined,
  };
}
