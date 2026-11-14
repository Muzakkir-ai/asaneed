import StudioClient from '../../app/studio/client';
import '../../app/studio/studio.css';

export default function StudioShellReview(){
 return <StudioClient user={{id:'fixture-issuer',email:'issuer@example.test',name:'مجيز تجريبي',image:null,role:'shaykh',canIssue:true}}/>;
}
