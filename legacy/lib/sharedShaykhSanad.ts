/** Standard readings can share a personal prefix. Numbered routes carry complete chains. */
export function usesSharedSughra(profile: {sharedSughraSanad?: boolean}, tariqNumber?: string) {
 return profile.sharedSughraSanad === true && !tariqNumber;
}
