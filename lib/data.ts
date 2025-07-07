
// ICI

export interface Image {
  id: string;
  fileUrl: string;
  fileType: 'link' | 'storage' | 'coverLink' | 'coverStorage';
  fileUrlThumbnail?: string;
}

export interface Wedding {
  id: number;
  folderId: string;
  title: string;
  date: string;
  location: string;
  description: string;
  visible: boolean; 
  images: Image[];
  coverImage?: Image;
}

  export const weddings: Wedding[] = [
  {
    "id": 1,
    "title": "Mariage Nour",
    "folderId": "1736284401300",
    "date": "décembre 2024",
    "location": "Paris",
    "description": "",
    "visible": true,
    "coverImage": {
      "id": "1736899059204",
      "fileUrl": "/1736284401300/1736899298693-N 1.O.jpg",
      "fileType": "coverStorage"
    },
    "images": [
      {
        "id": "1736898980862",
        "fileUrl": "/1736284401300/1736898994342-N 4.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736898994342-N 4_THUMBEL.jpg"
      },
      {
        "id": "1736898980863",
        "fileUrl": "/1736284401300/1736898994802-N 3.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736898994802-N 3_THUMBEL.jpg"
      },
      {
        "id": "1736898980864",
        "fileUrl": "/1736284401300/1736898995845-N 2.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736898995845-N 2_THUMBEL.jpg"
      },
      {
        "id": "1736898980865",
        "fileUrl": "/1736284401300/1736898996907-N 1.O.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736898996907-N 1.O_THUMBEL.jpg"
      },
      {
        "id": "1736898980866",
        "fileUrl": "/1736284401300/1736898997530-N 19.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736898997530-N 19_THUMBEL.jpg"
      },
      {
        "id": "1736898980867",
        "fileUrl": "/1736284401300/1736898999872-N 18.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736898999872-N 18_THUMBEL.jpg"
      },
      {
        "id": "1736898980868",
        "fileUrl": "/1736284401300/1736899002068-N 17.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736899002068-N 17_THUMBEL.jpg"
      },
      {
        "id": "1736898980869",
        "fileUrl": "/1736284401300/1736899003783-N 16.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736899003783-N 16_THUMBEL.jpg"
      },
      {
        "id": "1736898980870",
        "fileUrl": "/1736284401300/1736899005149-N 15.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736899005149-N 15_THUMBEL.jpg"
      },
      {
        "id": "1736898980871",
        "fileUrl": "/1736284401300/1736899006809-N 14.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736899006809-N 14_THUMBEL.jpg"
      },
      {
        "id": "1736898980872",
        "fileUrl": "/1736284401300/1736899008000-N 13.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736899008000-N 13_THUMBEL.jpg"
      },
      {
        "id": "1736898980873",
        "fileUrl": "/1736284401300/1736899009056-N 12.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736899009056-N 12_THUMBEL.jpg"
      },
      {
        "id": "1736898980874",
        "fileUrl": "/1736284401300/1736899010131-N 11.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736899010131-N 11_THUMBEL.jpg"
      },
      {
        "id": "1736898980875",
        "fileUrl": "/1736284401300/1736899012118-N 10.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736899012118-N 10_THUMBEL.jpg"
      },
      {
        "id": "1736898980876",
        "fileUrl": "/1736284401300/1736899014183-N 9.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736899014183-N 9_THUMBEL.jpg"
      },
      {
        "id": "1736898980877",
        "fileUrl": "/1736284401300/1736899019274-N 8.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736899019274-N 8_THUMBEL.jpg"
      },
      {
        "id": "1736898980878",
        "fileUrl": "/1736284401300/1736899021023-N 7.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736899021023-N 7_THUMBEL.jpg"
      },
      {
        "id": "1736898980879",
        "fileUrl": "/1736284401300/1736899023653-N 6.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736899023653-N 6_THUMBEL.jpg"
      },
      {
        "id": "1736898980880",
        "fileUrl": "/1736284401300/1736899025834-N 5.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736284401300/thumbnails/1736899025834-N 5_THUMBEL.jpg"
      }
    ]
  },
  {
    "id": 2,
    "folderId": "1736326837983",
    "coverImage": {
      "id": "1736902411615",
      "fileUrl": "/1736326837983/1736902661708-Mariage_S_et_B_1.jpg",
      "fileType": "coverStorage"
    },
    "title": "Mariage S.B",
    "date": "été 2023",
    "location": "Paris",
    "description": "",
    "visible": true,
    "images": [
      {
        "id": "1736902411589",
        "fileUrl": "/1736326837983/1736902449312-Mariage_S_et_B_2.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902449312-Mariage_S_et_B_2_THUMBEL.jpg"
      },
      {
        "id": "1736902411590",
        "fileUrl": "/1736326837983/1736902449480-Mariage_S_et_B_3.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902449480-Mariage_S_et_B_3_THUMBEL.jpg"
      },
      {
        "id": "1736902411591",
        "fileUrl": "/1736326837983/1736902449670-Mariage_S_et_B_4.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902449670-Mariage_S_et_B_4_THUMBEL.jpg"
      },
      {
        "id": "1736902411592",
        "fileUrl": "/1736326837983/1736902449921-Mariage_S_et_B_5.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902449921-Mariage_S_et_B_5_THUMBEL.jpg"
      },
      {
        "id": "1736902411593",
        "fileUrl": "/1736326837983/1736902450022-Mariage_S_et_B_6.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902450022-Mariage_S_et_B_6_THUMBEL.jpg"
      },
      {
        "id": "1736902411594",
        "fileUrl": "/1736326837983/1736902450192-Mariage_S_et_B_7.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902450192-Mariage_S_et_B_7_THUMBEL.jpg"
      },
      {
        "id": "1736902411595",
        "fileUrl": "/1736326837983/1736902450348-Mariage_S_et_B_8.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902450348-Mariage_S_et_B_8_THUMBEL.jpg"
      },
      {
        "id": "1736902411596",
        "fileUrl": "/1736326837983/1736902450502-Mariage_S_et_B_9.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902450502-Mariage_S_et_B_9_THUMBEL.jpg"
      },
      {
        "id": "1736902411597",
        "fileUrl": "/1736326837983/1736902450651-Mariage_S_et_B_10.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902450651-Mariage_S_et_B_10_THUMBEL.jpg"
      },
      {
        "id": "1736902411598",
        "fileUrl": "/1736326837983/1736902450851-Mariage_S_et_B_11.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902450851-Mariage_S_et_B_11_THUMBEL.jpg"
      },
      {
        "id": "1736902411599",
        "fileUrl": "/1736326837983/1736902450983-Mariage_S_et_B_12.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902450983-Mariage_S_et_B_12_THUMBEL.jpg"
      },
      {
        "id": "1736902411600",
        "fileUrl": "/1736326837983/1736902451176-Mariage_S_et_B_13.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902451176-Mariage_S_et_B_13_THUMBEL.jpg"
      },
      {
        "id": "1736902411601",
        "fileUrl": "/1736326837983/1736902451468-Mariage_S_et_B_14.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902451468-Mariage_S_et_B_14_THUMBEL.jpg"
      },
      {
        "id": "1736902411602",
        "fileUrl": "/1736326837983/1736902451710-Mariage_S_et_B_15.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902451710-Mariage_S_et_B_15_THUMBEL.jpg"
      },
      {
        "id": "1736902411603",
        "fileUrl": "/1736326837983/1736902451884-Mariage_S_et_B_16.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902451884-Mariage_S_et_B_16_THUMBEL.jpg"
      },
      {
        "id": "1736902411604",
        "fileUrl": "/1736326837983/1736902452130-Mariage_S_et_B_17.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902452130-Mariage_S_et_B_17_THUMBEL.jpg"
      },
      {
        "id": "1736902411605",
        "fileUrl": "/1736326837983/1736902452335-Mariage_S_et_B_18.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902452335-Mariage_S_et_B_18_THUMBEL.jpg"
      },
      {
        "id": "1736902411606",
        "fileUrl": "/1736326837983/1736902453146-Mariage_S_et_B_19.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902453146-Mariage_S_et_B_19_THUMBEL.jpg"
      },
      {
        "id": "1736902411607",
        "fileUrl": "/1736326837983/1736902453873-Mariage_S_et_B_20.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902453873-Mariage_S_et_B_20_THUMBEL.jpg"
      },
      {
        "id": "1736902411608",
        "fileUrl": "/1736326837983/1736902454285-Mariage_S_et_B_21.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902454285-Mariage_S_et_B_21_THUMBEL.jpg"
      },
      {
        "id": "1736902411609",
        "fileUrl": "/1736326837983/1736902454787-Mariage_S_et_B_22.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902454787-Mariage_S_et_B_22_THUMBEL.jpg"
      },
      {
        "id": "1736902411610",
        "fileUrl": "/1736326837983/1736902455363-Mariage_S_et_B_23.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902455363-Mariage_S_et_B_23_THUMBEL.jpg"
      },
      {
        "id": "1736902411611",
        "fileUrl": "/1736326837983/1736902455476-Mariage_S_et_B_24.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902455476-Mariage_S_et_B_24_THUMBEL.jpg"
      },
      {
        "id": "1736902411612",
        "fileUrl": "/1736326837983/1736902455941-Mariage_S_et_B_25.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902455941-Mariage_S_et_B_25_THUMBEL.jpg"
      },
      {
        "id": "1736902411613",
        "fileUrl": "/1736326837983/1736902456154-Mariage_S_et_B_26.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902456154-Mariage_S_et_B_26_THUMBEL.jpg"
      },
      {
        "id": "1736902411614",
        "fileUrl": "/1736326837983/1736902456585-Mariage_S_et_B_27.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736326837983/thumbnails/1736902456585-Mariage_S_et_B_27_THUMBEL.jpg"
      }
    ]
  },
  {
    "id": 3,
    "folderId": "1736944337584",
    "coverImage": {
      "id": "1737238840586",
      "fileUrl": "/1736944337584/1737238840598-coverRef.png",
      "fileType": "coverStorage",
      "fileUrlThumbnail": "/1736944337584/thumbnails/1737238840598-coverRef_THUMBEL.png"
    },
    "title": "Nouvel événement avec id 3",
    "date": "2025-01-15T12:32:17.584Z",
    "location": "",
    "description": "Un mariage pas comme les autres.",
    "visible": true,
    "images": [
      {
        "id": "1736944355227",
        "fileUrl": "/1736944337584/1736944355230-CyvNw1A2TE61hWjeo8p1ig.jpeg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736944337584/thumbnails/1736944355230-CyvNw1A2TE61hWjeo8p1ig_THUMBEL.jpeg"
      },
      {
        "id": "1736944355228",
        "fileUrl": "/1736944337584/1736944355678-eoRkID-5RiyJBm7Hr20bsw.jpeg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736944337584/thumbnails/1736944355678-eoRkID-5RiyJBm7Hr20bsw_THUMBEL.jpeg"
      },
      {
        "id": "1736944355229",
        "fileUrl": "/1736944337584/1736944356817-Gkyk0nHBQyGDq4KMYPkBCQ.webp",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736944337584/thumbnails/1736944356817-Gkyk0nHBQyGDq4KMYPkBCQ_THUMBEL.webp"
      },
      {
        "id": "1736951728900",
        "fileUrl": "/1736944337584/1736952837888-2rs_FltaTX-HLtfN2cf8XQ.png",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736944337584/thumbnails/1736952837888-2rs_FltaTX-HLtfN2cf8XQ_THUMBEL.png"
      },
      {
        "id": "1737222010807",
        "fileUrl": "/1736944337584/1737222057247-Capture d’écran 2025-01-14 à 11.02.56.png",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736944337584/thumbnails/1737222057247-Capture d’écran 2025-01-14 à 11.02.56_THUMBEL.png"
      },
      {
        "id": "1736951728901",
        "fileUrl": "/1736944337584/1736952838663-a.png",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736944337584/thumbnails/1736952838663-a_THUMBEL.png"
      },
      {
        "id": "1736951728902",
        "fileUrl": "/1736944337584/1736952839297-Gkyk0nHBQyGDq4KMYPkBCQ.png",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736944337584/thumbnails/1736952839297-Gkyk0nHBQyGDq4KMYPkBCQ_THUMBEL.png"
      },
      {
        "id": "1737227565024",
        "fileUrl": "/1736944337584/1737227565030-39.jpg",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736944337584/thumbnails/1737227565030-39_THUMBEL.jpg"
      },
      {
        "id": "1737227850669",
        "fileUrl": "/1736944337584/1737227852027-Capture d’écran 2025-01-18 à 20.17.19.png",
        "fileType": "storage",
        "fileUrlThumbnail": "/1736944337584/thumbnails/1737227852027-Capture d’écran 2025-01-18 à 20.17.19_THUMBEL.png"
      }
    ]
  }
];

