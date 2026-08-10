const DATA_EMISSION = "Data(origin=Origin.SOT, isStale=true, refreshing=true)";
const ERROR_EMISSION = "Error(StoreError.Fetch, servedStale=true)";

export function KeyEngineTrace() {
  return (
    <figure className="rounded-[1.75rem] border border-store-code-foreground/15 bg-store-code-surface p-5 text-store-code-foreground shadow-surface sm:p-7">
      <svg
        aria-labelledby="key-engine-trace-title key-engine-trace-description"
        className="block h-auto w-full"
        role="img"
        viewBox="0 0 780 548"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title id="key-engine-trace-title">Cold stream trace for an invalidated persisted row</title>
        <desc id="key-engine-trace-description">
          Under the default freshness validator with Freshness.CachedOrFetch, Store hydrates a
          durably invalidated persisted row, requests an unconditional fetch with etag null, emits
          stale refreshing data from Origin.SOT, completes failure bookkeeping before emitting a
          served-stale fetch error, and keeps the stream live. A queued stale data replay may occur
          before the error.
        </desc>

        <text className="fill-store-code-foreground font-mono text-[15px] font-semibold" x="24" y="28">
          Cold subscription after restart
        </text>

        <g aria-label="Durably invalidated persisted row" role="group">
          <rect
            className="fill-store-code-surface stroke-store-origin-sot-on-dark"
            height="84"
            rx="14"
            strokeWidth="2"
            width="220"
            x="24"
            y="64"
          />
          <text className="fill-store-origin-sot-on-dark font-mono text-[15px]" x="44" y="98">
            Durably invalidated
          </text>
          <text className="fill-store-origin-sot-on-dark font-mono text-[15px]" x="44" y="123">
            persisted row
          </text>
        </g>

        <path
          className="stroke-store-code-foreground/50"
          d="M244 106H280"
          fill="none"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path className="fill-store-code-foreground" d="m280 101 10 5-10 5Z" />

        <g aria-label="Hydrate resident state" role="group">
          <rect
            className="fill-store-code-surface stroke-store-code-foreground/50"
            height="68"
            rx="14"
            strokeWidth="2"
            width="190"
            x="290"
            y="72"
          />
          <text className="fill-store-code-foreground font-mono text-[15px]" x="315" y="112">
            Hydrate resident state
          </text>
        </g>

        <path
          className="stroke-store-code-foreground/50"
          d="M480 106H528"
          fill="none"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path className="fill-store-code-foreground" d="m528 101 10 5-10 5Z" />

        <g aria-label="Fetcher request with etag null" role="group">
          <rect
            className="fill-store-code-surface stroke-store-origin-fetcher-on-dark"
            height="108"
            rx="14"
            strokeWidth="2"
            width="218"
            x="538"
            y="52"
          />
          <text className="fill-store-origin-fetcher-on-dark font-mono text-[15px]" x="558" y="98">
            Fetcher request
          </text>
          <text className="fill-store-origin-fetcher-on-dark font-mono text-[15px]" x="558" y="123">
            etag=null
          </text>
        </g>

        <path
          className="stroke-store-origin-fetcher-on-dark"
          d="M647 160V198"
          fill="none"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path className="fill-store-origin-fetcher-on-dark" d="m642 198 5 10 5-10Z" />

        <g aria-label={DATA_EMISSION} role="group">
          <rect
            className="fill-store-code-surface stroke-store-origin-sot-on-dark"
            height="108"
            rx="14"
            strokeWidth="2"
            width="218"
            x="538"
            y="208"
          />
          <text className="fill-store-origin-sot-on-dark font-mono text-[14px]" x="558" y="239">
            Data(origin=Origin.SOT,
          </text>
          <text className="fill-store-origin-sot-on-dark font-mono text-[14px]" x="558" y="264">
            isStale=true,
          </text>
          <text className="fill-store-origin-sot-on-dark font-mono text-[14px]" x="558" y="289">
            refreshing=true)
          </text>
        </g>

        <g aria-label="Queued stale Data replay may occur" role="note">
          <rect
            className="fill-store-code-surface stroke-store-origin-sot-on-dark"
            height="92"
            rx="14"
            strokeDasharray="6 7"
            strokeWidth="2"
            width="220"
            x="24"
            y="316"
          />
          <text className="fill-store-origin-sot-on-dark font-mono text-[14px]" x="44" y="350">
            Queued stale Data replay
          </text>
          <text className="fill-store-origin-sot-on-dark font-mono text-[14px]" x="44" y="375">
            may occur before error
          </text>
        </g>

        <path
          className="stroke-store-code-foreground/50"
          d="M647 316V334H480V344"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path className="fill-store-code-foreground" d="m475 344 5 10 5-10Z" />

        <g aria-label="Bookkeeper recordFailure completes" role="group">
          <rect
            className="fill-store-code-surface stroke-store-code-foreground/50"
            height="72"
            rx="14"
            strokeWidth="2"
            width="220"
            x="370"
            y="354"
          />
          <text className="fill-store-code-foreground font-mono text-[14px]" x="390" y="386">
            Bookkeeper.recordFailure
          </text>
          <text className="fill-store-code-foreground font-mono text-[14px]" x="390" y="410">
            completes
          </text>
        </g>

        <path
          className="stroke-store-code-foreground/50"
          d="M590 390H647V428"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path className="fill-store-code-foreground" d="m642 428 5 10 5-10Z" />

        <g aria-label={ERROR_EMISSION} role="group">
          <rect
            className="fill-store-code-surface stroke-store-origin-fetcher-on-dark"
            height="92"
            rx="14"
            strokeWidth="2"
            width="218"
            x="538"
            y="438"
          />
          <text className="fill-store-origin-fetcher-on-dark font-mono text-[14px]" x="558" y="471">
            Error(StoreError.Fetch,
          </text>
          <text className="fill-store-origin-fetcher-on-dark font-mono text-[14px]" x="558" y="496">
            servedStale=true)
          </text>
          <text className="fill-store-code-foreground font-mono text-[14px] font-semibold" x="558" y="518">
            Stream remains live
          </text>
        </g>
      </svg>

      <figcaption className="mt-5 space-y-3 border-t border-store-code-foreground/15 pt-5 text-sm leading-6 text-store-code-foreground">
        <p>
          Trace conditions: a first cold subscription after restart, a durably invalidated persisted
          row, the default freshness validator, and <code>Freshness.CachedOrFetch</code>. Wall-clock
          age alone does not trigger this fetch. A custom FreshnessValidator can plan differently.
        </p>
        <p>
          A queued stale Data replay is permitted before the error, without an intervening Loading;
          the stream remains live. <code>Bookkeeper.recordFailure</code> completes before the public
          error is emitted. Hydration reconstructs resident fetch metadata with <code>etag=null</code>;
          the durable record may still retain its stored ETag. After hydration populates memory, a
          later resident replay may carry <code>Origin.MEMORY</code>.
        </p>
      </figcaption>
    </figure>
  );
}
