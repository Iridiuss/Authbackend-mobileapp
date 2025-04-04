import axios from 'axios';

async function fetchLinkedInProfile(accessToken: string, issuer: string): Promise<any> {
    try {
        const response = await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching LinkedIn profile:', error);
        throw error;
    }
}

// Example usage:
const myAccessToken = 'AQUT0GAZN368gNxOmTtZgDEeOhZHuT5XA62FyoMs80gINRo6wy8OVB0PhbOrZYa0why2jd9qztvwOMYG0mXEBgfInYyvdc0pbSV8hxRfr_c1M7M1VxIUNzmZMZh77HziGuCK2lcYXYk_hzAB3oAWOsz-5tmEmN877R9JwJ-AFroYhlLF3ekj7r1IwnjfTaC8s9adQ2oNCWvJ9Rr8F0tSqg1pF8Ax0gP2d_aUz1fa9m6lF2OIp_IgFxlEoYzwElMIja3aNQLJWjfxWlwlNTj1vrqnum8lh5PdIot25i336zxqASvtwjUEpmN7ZcX-tlI0VdTUIfl0BOjygblIFIdjl5noRGts-w';
fetchLinkedInProfile(myAccessToken, 'https://www.linkedin.com/')
    .then(profileData => {
        console.log('LinkedIn Profile Data:', profileData);
    })
    .catch(error => {
        console.error(error);
    });

export default fetchLinkedInProfile;