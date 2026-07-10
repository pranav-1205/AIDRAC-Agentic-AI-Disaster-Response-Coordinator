import type { EmergencyDestinationType, NearbyResponse } from '../types';

const DESTINATION_CATEGORY_MAP: Record<EmergencyDestinationType, keyof NearbyResponse> = {
  shelter: 'shelters',
  community_centre: 'community_centres',
  school: 'schools',
  hospital: 'hospitals',
  police: 'police',
  firestation: 'firestations',
  pharmacy: 'pharmacies',
};

export function getCategory(dest: EmergencyDestinationType): keyof NearbyResponse | undefined {
  return DESTINATION_CATEGORY_MAP[dest];
}
