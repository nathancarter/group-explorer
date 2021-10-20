// @flow

// to deal gracefully with old GE3 html pages that didn't have version metadata (e.g., 3.1 -> 3.3 migration)
export const label =
  (getGITVersion() == null) ? '' : ('GE ' + ((semanticMatch(getGITVersion()) /*: any */) /*: RegExp$matchResult */)[0])

function getGITVersion () /*: string */ {
  return $('meta[name="GE3-GITVersion"]').attr('content')
}

function semanticMatch (gitVersion /*: string */) {
  return gitVersion.match(/([0-9]+).([0-9]+).([^-]+)/)
}

// export Version, for compatibility during a 3.2 -> 3.3 migration
export const Version = {
  label: 'GE 3.2.0'
}
