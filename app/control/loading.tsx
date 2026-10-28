import {getLocale} from '../../lib/locale-server';
import {managementMessages} from '../../lib/manage-i18n';
export default async function Loading(){return <section className="panel" role="status">{managementMessages[await getLocale()].loading}</section>;}
