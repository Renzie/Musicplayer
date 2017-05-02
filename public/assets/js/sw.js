/**
 * Created by Renzie on 21/04/2017.
 */
'use strict';



self.addEventListener("push", function(e)
{
    var title = "Howest";
    var options = {
        body: "Hello world!",
        icon: "../../images/covers/defaultcover.jpg",
        badge: "../../images/covers/defaultcover.jpg"
    };

    e.waitUntil(self.registration.showNotification(title, options));
});