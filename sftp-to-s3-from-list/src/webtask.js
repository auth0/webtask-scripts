import Webtask from 'webtask-tools';
import sftpToS3FromList from './main';

export default Webtask.fromExpress(sftpToS3FromList);
